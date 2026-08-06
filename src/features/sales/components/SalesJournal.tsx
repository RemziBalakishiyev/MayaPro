import { useCallback, useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  FileText,
  Loader2,
  Pencil,
  Receipt,
  Trash2,
} from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyValue } from "@/components/ui/EmptyValue";
import { FilterBar } from "@/components/ui/FilterBar";
import { inputCls } from "@/components/ui/Input";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import type { PeriodRange } from "@/components/ui/period-filter-lib";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/toast-store";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { useCan } from "@/features/auth/store";
import { useCustomers } from "@/features/customers/queries";
import { ApiError, USE_MOCK } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { downloadFile } from "@/lib/download";
import { fmtDate, fmtMoney, fmtMoneySigned } from "@/lib/format";
import { useEmployees } from "@/features/employees/queries";
import { saleBatchExpense, saleDateTime } from "../lib";
import { JOURNAL_PAGE_SIZE, useDeleteSale, useSalesJournal } from "../queries";
import { SalesKpiCards } from "./SalesKpiCards";
import { useInvoiceDownload } from "../useInvoiceDownload";
import { useInvoiceWhatsApp } from "../useInvoiceWhatsApp";
import { SaleDetailDrawer } from "./SaleDetailDrawer";
import { SaleEditDrawer } from "./SaleEditDrawer";
import type { PaymentType, Sale } from "@/types";

const routeApi = getRouteApi("/_app/satis");

const saleTime = (iso: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return fmtDate(iso, "dd.MM");
  return fmtDate(iso, "HH:mm");
};

/** Cədvəldəki ikinci dərəcəli pul sütunları üçün eyni tipoqrafiya. */
const moneyCls = "tabular-nums text-sm text-stone-700";

const parseNum = (raw: string): number | undefined => {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/** Satış jurnalı — filterlər + DataTable 10-luq pagination. */
export function SalesJournal() {
  const toast = useToast();
  const canManage = useCan()("sales.manage");
  const deleteSale = useDeleteSale();
  const navigate = routeApi.useNavigate();
  const { from, to, pay, q, minProfit, maxProfit, minQty, maxQty } =
    routeApi.useSearch();
  const range: PeriodRange = { from, to };
  const updateRange = (patch: PeriodRange) =>
    navigate({
      search: (prev) => ({ ...prev, from: patch.from, to: patch.to }),
    });
  const { data: employees = [] } = useEmployees();
  const { data: customersData = [] } = useCustomers();
  const customerName = useMemo(() => {
    const map = new Map(customersData.map((c) => [c.id, c.name]));
    return (s: Sale) =>
      s.customerId ? (map.get(s.customerId) ?? null) : null;
  }, [customersData]);
  const customerPhone = useMemo(() => {
    const map = new Map(customersData.map((c) => [c.id, c.phone]));
    return (s: Sale) => (s.customerId ? (map.get(s.customerId) ?? "") : "");
  }, [customersData]);
  const { download: downloadInvoice, pendingId: invoicePendingId } =
    useInvoiceDownload();
  const { send: sendInvoiceWa, pendingId: waPendingId } = useInvoiceWhatsApp();
  const journal = useSalesJournal({
    from,
    to,
    paymentType: pay,
    q,
    minProfit,
    maxProfit,
    minQty,
    maxQty,
  });

  // Axtarış və panel içindəki filtrlər ayrıca sayılır — dövr artıq FilterBar-da
  // deyil, ayrıca PeriodFilter-də idarə olunur (FE#56, AC16).
  const activeFilterCount = [
    !!pay,
    minProfit != null,
    maxProfit != null,
    minQty != null,
    maxQty != null,
  ].filter(Boolean).length;

  const [exportingPdf, setExportingPdf] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);

  const sellerName = useMemo(() => {
    const map = new Map(employees.map((e) => [e.id, e.name]));
    return (s: Sale) => s.soldByName || map.get(s.employeeId) || "—";
  }, [employees]);

  /** Sətir əməliyyat menyusu: WhatsApp (hamıya) + Düzəliş/Sil (yalnız sales.manage). */
  const buildMenuItems = useCallback(
    (s: Sale): ActionMenuItem[] => {
      const phone = customerPhone(s);
      const canWa = !!s.customerId && !!phone.trim();
      const waSending = waPendingId === s.id;
      const items: ActionMenuItem[] = [
        {
          label: "WhatsApp-la göndər",
          icon: waSending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <WhatsAppIcon size={15} />
          ),
          onClick: () => void sendInvoiceWa(s.id, phone, s.createdAt),
          disabled: !canWa || waSending,
          title: !s.customerId
            ? "Müştəri qeyd olunmayıb"
            : !phone.trim()
              ? "Müştəri telefonu yoxdur"
              : undefined,
        },
      ];
      if (canManage) {
        items.push(
          {
            label: "Düzəliş",
            icon: <Pencil size={15} />,
            onClick: () => setEditId(s.id),
          },
          {
            label: "Sil",
            icon: <Trash2 size={15} />,
            onClick: () => setDeleteTarget(s),
            tone: "danger",
          },
        );
      }
      return items;
    },
    [canManage, customerPhone, sendInvoiceWa, waPendingId],
  );

  const sales = journal.data ?? [];
  const tableKey = [
    from ?? "",
    to ?? "",
    pay ?? "",
    q ?? "",
    minProfit ?? "",
    maxProfit ?? "",
    minQty ?? "",
    maxQty ?? "",
  ].join("|");

  const columns = useMemo<ColumnDef<Sale, unknown>[]>(
    () => [
      {
        accessorKey: "productName",
        header: "Mal",
        cell: ({ row }) => {
          const s = row.original;
          const cus = customerName(s);
          return (
            <div className="min-w-0 max-w-[220px]">
              <p className="truncate font-semibold text-stone-900">
                {s.productName}
              </p>
              {(s.category || s.isManual) && (
                <p className="mt-0.5 truncate text-xs text-stone-400">
                  {[s.category, s.isManual ? "Sərbəst" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {cus && (
                <p className="mt-0.5 truncate text-xs font-medium text-emerald-700">
                  {cus}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: "Say",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue() as number}</span>
        ),
      },
      {
        id: "purchasePricePerUnit",
        header: () => (
          <span title="Malın alış qiyməti (1 ədəd)">Maya qiyməti</span>
        ),
        meta: { className: "hidden lg:table-cell" },
        cell: ({ row }) => {
          const p = row.original.purchasePricePerUnit;
          if (p == null) return <EmptyValue />;
          return <span className={moneyCls}>{fmtMoney(p)}</span>;
        },
      },
      {
        id: "xerc",
        header: () => <span title="Bu satışa düşən partiya xərci">Xərc</span>,
        meta: { className: "hidden lg:table-cell" },
        cell: ({ row }) => {
          const cost = saleBatchExpense(row.original);
          if (cost == null) return <EmptyValue />;
          return <span className={moneyCls}>{fmtMoney(cost)}</span>;
        },
      },
      {
        accessorKey: "salePrice",
        header: () => <span title="1 ədədin satış qiyməti">Satış qiyməti</span>,
        cell: ({ getValue }) => (
          <span className={moneyCls}>{fmtMoney(getValue() as number)}</span>
        ),
      },
      {
        accessorKey: "profit",
        header: () => (
          <span title="Yekun məbləğdən maya çıxıldıqdan sonra qalan">
            Qazanc
          </span>
        ),
        cell: ({ getValue }) => {
          const p = getValue() as number | null;
          if (p == null) {
            return <span className="text-sm text-stone-400">naməlum</span>;
          }
          return (
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                p < 0 ? "text-red-600" : "text-emerald-700",
              )}
            >
              {fmtMoneySigned(p)}
            </span>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: () => <span title="Müştəridən alınan pul">Yekun</span>,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div>
              <span className="text-base font-bold tabular-nums text-stone-900">
                {fmtMoney(s.totalAmount)}
              </span>
              {/* FE#25 (AC8) — qismən ödənişdə Yekun yanında kiçik boz sətir */}
              {s.remainingAmount > 0 && s.paidAmount > 0 && (
                <p className="text-xs tabular-nums text-stone-400">
                  {fmtMoney(s.paidAmount)} ödənilib
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "paymentType",
        header: "Ödəniş",
        cell: ({ getValue }) => {
          const pt = getValue() as PaymentType;
          return <Badge tone={pt}>{pt}</Badge>;
        },
      },
      {
        id: "seller",
        header: "Satıcı",
        meta: { className: "hidden lg:table-cell" },
        cell: ({ row }) => (
          <span className="text-sm text-stone-600">
            {sellerName(row.original)}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Tarix",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm text-stone-600">
            {saleDateTime(getValue() as string)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Əməliyyat",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          const invoicePending = invoicePendingId === s.id;
          return (
            // Sətir onRowClick ilə detal draweri açır — bu sahədəki düymələr/menyu
            // öz funksiyasını icra etsin, drawer açmasın deyə bubbling dayandırılır.
            <div
              className="flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setDetailId(s.id)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-200"
              >
                <Eye size={14} />
                Detal
              </button>
              <button
                type="button"
                title="Qaimə (PDF)"
                aria-label={`${s.productName} qaiməsi`}
                onClick={() => void downloadInvoice(s.id)}
                disabled={invoicePending}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-600 transition-colors hover:bg-stone-200 disabled:opacity-50"
              >
                {invoicePending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Receipt size={14} />
                )}
              </button>
              <ActionMenu
                items={buildMenuItems(s)}
                aria-label={`${s.productName} əməliyyatları`}
              />
            </div>
          );
        },
      },
    ],
    [
      buildMenuItems,
      sellerName,
      downloadInvoice,
      invoicePendingId,
      customerName,
    ],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSale.mutateAsync(deleteTarget.id);
      toast.success("Satış silindi");
      // Silinən satış hazırda detal drawerdə açıqdırsa, onu da bağla.
      if (detailId === deleteTarget.id) setDetailId(null);
      setDeleteTarget(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error(e.message || "Gün bağlanıb");
      } else {
        toast.error(e instanceof Error ? e.message : "Satış silinmədi");
      }
    }
  };

  const clearFilters = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        pay: undefined,
        minProfit: undefined,
        maxProfit: undefined,
        minQty: undefined,
        maxQty: undefined,
        q: undefined,
      }),
    });
  };

  const exportPdf = async () => {
    if (USE_MOCK) {
      toast.info("Export real backend rejimində işləyir");
      return;
    }
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const query = qs.toString();
    const path = `/api/exports/sales.pdf${query ? `?${query}` : ""}`;

    setExportingPdf(true);
    try {
      await downloadFile(path, "sales.pdf");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF endirilmədi");
    } finally {
      setExportingPdf(false);
    }
  };

  // Aktif filtrlər çiplər üçün — dövr PeriodFilter-in öz çipində göstərilir.
  const activeFilters = [
    pay && { id: "pay", label: pay },
    minProfit != null && { id: "minProfit", label: `Min: ${fmtMoney(minProfit)}` },
    maxProfit != null && { id: "maxProfit", label: `Max: ${fmtMoney(maxProfit)}` },
    minQty != null && { id: "minQty", label: `Min say: ${minQty}` },
    maxQty != null && { id: "maxQty", label: `Max say: ${maxQty}` },
  ].filter(Boolean) as Array<{ id: string; label: string }>;

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === "pay")
      navigate({ search: (prev) => ({ ...prev, pay: undefined }) });
    else if (filterId === "minProfit")
      navigate({ search: (prev) => ({ ...prev, minProfit: undefined }) });
    else if (filterId === "maxProfit")
      navigate({ search: (prev) => ({ ...prev, maxProfit: undefined }) });
    else if (filterId === "minQty")
      navigate({ search: (prev) => ({ ...prev, minQty: undefined }) });
    else if (filterId === "maxQty")
      navigate({ search: (prev) => ({ ...prev, maxQty: undefined }) });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
      <div className="space-y-3 border-b border-stone-100 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="shrink-0 text-base font-bold text-stone-800">
            Satışlar
          </h2>
        </div>

        {/* FE#56 — dövr filtri KPI sırası ilə jurnal cədvəlini eyni aralıqla
            paylaşır (AC16/AC17): tək seçim, iki ayrı dövr göstərici yoxdur. */}
        <PeriodFilter value={range} onChange={updateRange} defaultKey="all" />
        <SalesKpiCards range={range} />

        <div className="flex flex-wrap items-stretch gap-2">
          <FilterBar
            searchValue={q ?? ""}
            onSearchChange={(val) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  q: val || undefined,
                }),
              })
            }
            searchAriaLabel="Satış axtar"
            searchPlaceholder="Bu siyahıda axtar..."
            activeCount={activeFilterCount}
            activeFilters={activeFilters}
            onRemoveFilter={handleRemoveFilter}
            onClear={clearFilters}
            clearLabel="Filterləri təmizlə"
            label="Filterlər"
          >
            {/* 5 filter sütun grid (lg:5, md:3, sm:2, mobil:1) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {/* Ödəniş */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500">
                  Ödəniş
                </label>
                <Select
                  aria-label="Ödəniş"
                  value={pay ?? ""}
                  onChange={(e) => {
                    const v = e.target.value as PaymentType | "";
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        pay: v || undefined,
                      }),
                    });
                  }}
                  className="h-10 w-full text-sm"
                >
                  <option value="">Hamısı</option>
                  <option value="Nağd">Nağd</option>
                  <option value="Kart">Kart</option>
                  <option value="Nisyə">Nisyə</option>
                </Select>
              </div>

              {/* Min qazanc */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500">
                  Min qazanc
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label="Min qazanc"
                  value={minProfit ?? ""}
                  onChange={(e) =>
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        minProfit: parseNum(e.target.value),
                      }),
                    })
                  }
                  placeholder="0"
                  className={cn(inputCls, "h-10 px-3 text-sm")}
                />
              </div>

              {/* Max qazanc */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500">
                  Max qazanc
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label="Max qazanc"
                  value={maxProfit ?? ""}
                  onChange={(e) =>
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        maxProfit: parseNum(e.target.value),
                      }),
                    })
                  }
                  placeholder="∞"
                  className={cn(inputCls, "h-10 px-3 text-sm")}
                />
              </div>

              {/* Min say */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500">
                  Min say
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  aria-label="Min say"
                  value={minQty ?? ""}
                  onChange={(e) =>
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        minQty: parseNum(e.target.value),
                      }),
                    })
                  }
                  placeholder="1"
                  className={cn(inputCls, "h-10 px-3 text-sm")}
                />
              </div>

              {/* Max say */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500">
                  Max say
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  aria-label="Max say"
                  value={maxQty ?? ""}
                  onChange={(e) =>
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        maxQty: parseNum(e.target.value),
                      }),
                    })
                  }
                  placeholder="∞"
                  className={cn(inputCls, "h-10 px-3 text-sm")}
                />
              </div>
            </div>
          </FilterBar>

          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 self-start"
            icon={
              exportingPdf ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )
            }
            onClick={() => void exportPdf()}
            disabled={exportingPdf}
          >
            PDF hesabat
          </Button>
        </div>
      </div>

      <div className="p-3 pb-4 sm:px-4 sm:pb-4">
        <DataTable
          key={tableKey}
          columns={columns}
          data={sales}
          isLoading={journal.isLoading}
          isError={journal.isError}
          onRetry={() => void journal.refetch()}
          errorMessage="Satış jurnalı yüklənmədi"
          pageSize={JOURNAL_PAGE_SIZE}
          embedded
          onRowClick={(s) => setDetailId(s.id)}
          emptyState={{
            title: "Satış yoxdur",
            description:
              q?.trim() || activeFilterCount > 0
                ? "Filterə uyğun satış tapılmadı."
                : "Seçilmiş filtrə uyğun satış tapılmadı.",
          }}
          mobileCard={(s) => (
            <div className="rounded-xl border border-stone-200 bg-white p-3.5">
              <div className="flex items-baseline gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-stone-900">
                  {s.productName}
                </p>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold tabular-nums text-stone-900">
                    {fmtMoney(s.totalAmount)}
                  </span>
                  {s.remainingAmount > 0 && s.paidAmount > 0 && (
                    <span className="block text-[11px] tabular-nums text-stone-400">
                      {fmtMoney(s.paidAmount)} ödənilib
                    </span>
                  )}
                </span>
              </div>
              {(s.category || s.isManual) && (
                <p className="mt-1 truncate text-xs text-stone-400">
                  {[s.category, s.isManual ? "Sərbəst" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {customerName(s) && (
                <p className="mt-1 truncate text-xs font-medium text-emerald-700">
                  {customerName(s)}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-xs tabular-nums text-stone-400">
                  {s.quantity} × {fmtMoney(s.salePrice)}
                  <span aria-hidden="true"> · </span>
                  <span className="sr-only">Qazanc: </span>
                  {s.profit == null ? (
                    "naməlum"
                  ) : (
                    <span
                      className={cn(
                        "font-medium",
                        s.profit < 0 ? "text-red-600" : "text-emerald-700",
                      )}
                    >
                      {fmtMoneySigned(s.profit)}
                    </span>
                  )}
                </span>
                <Badge
                  tone={s.paymentType}
                  className="px-1.5 py-0.5 text-[11px]"
                >
                  {s.paymentType}
                </Badge>
                <span className="ml-auto text-[11px] tabular-nums text-stone-400">
                  {saleTime(s.createdAt)}
                </span>
              </div>
              <div
                className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setDetailId(s.id)}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 text-base font-semibold text-stone-700 active:bg-stone-200"
                >
                  <Eye size={18} /> Detal
                </button>
                <button
                  type="button"
                  title="Qaimə (PDF)"
                  aria-label={`${s.productName} qaiməsi`}
                  onClick={() => void downloadInvoice(s.id)}
                  disabled={invoicePendingId === s.id}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 active:bg-stone-200 disabled:opacity-50"
                >
                  {invoicePendingId === s.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Receipt size={18} />
                  )}
                </button>
                <ActionMenu
                  items={buildMenuItems(s)}
                  aria-label={`${s.productName} əməliyyatları`}
                />
              </div>
            </div>
          )}
        />
      </div>

      <SaleDetailDrawer
        saleId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={(id) => setEditId(id)}
        onDelete={(s) => setDeleteTarget(s)}
      />

      <SaleEditDrawer
        saleId={editId}
        onClose={() => setEditId(null)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Satışı sil"
        message="Bu satışı silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz."
        confirmText="Sil"
        danger
      />
    </div>
  );
}
