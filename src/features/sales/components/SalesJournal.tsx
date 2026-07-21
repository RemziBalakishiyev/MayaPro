import { useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  FileText,
  Loader2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { inputCls } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/toast-store";
import { USE_MOCK } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { downloadFile } from "@/lib/download";
import { fmtDate, fmtMoney } from "@/lib/format";
import {
  PERIOD_LABELS,
  type Period,
} from "@/features/reports/lib";
import { useEmployees } from "@/features/employees/queries";
import { periodToRange } from "../lib";
import { JOURNAL_PAGE_SIZE, useSalesJournal } from "../queries";
import { SaleDetailDrawer } from "./SaleDetailDrawer";
import type { PaymentType, Sale } from "@/types";

const routeApi = getRouteApi("/_app/satis");

const PERIODS: Period[] = ["today", "week", "month", "all"];

const saleDateTime = (iso: string): string => {
  const date = fmtDate(iso, "dd.MM.yyyy");
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return date;
  return `${date} ${fmtDate(iso, "HH:mm")}`;
};

const saleTime = (iso: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return fmtDate(iso, "dd.MM");
  return fmtDate(iso, "HH:mm");
};

const parseNum = (raw: string): number | undefined => {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/** Satış jurnalı — filterlər + DataTable 10-luq pagination. */
export function SalesJournal() {
  const toast = useToast();
  const navigate = routeApi.useNavigate();
  const { period, pay, q, minProfit, maxProfit, minQty, maxQty } =
    routeApi.useSearch();
  const { data: employees = [] } = useEmployees();
  const journal = useSalesJournal({
    period,
    paymentType: pay,
    q,
    minProfit,
    maxProfit,
    minQty,
    maxQty,
  });

  const activeFilterCount = [
    period !== "today",
    !!pay,
    !!q?.trim(),
    minProfit != null,
    maxProfit != null,
    minQty != null,
    maxQty != null,
  ].filter(Boolean).length;

  const [filtersOpen, setFiltersOpen] = useState(
    () => activeFilterCount > 0,
  );
  const [exportingPdf, setExportingPdf] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const sellerName = useMemo(() => {
    const map = new Map(employees.map((e) => [e.id, e.name]));
    return (s: Sale) => s.soldByName || map.get(s.employeeId) || "—";
  }, [employees]);

  const sales = journal.data ?? [];
  const tableKey = [
    period,
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
          return (
            <div className="min-w-0 max-w-[220px]">
              <p className="truncate font-semibold text-stone-900">
                {s.productName}
              </p>
              <div className="mt-0.5 flex flex-nowrap items-center gap-1.5 overflow-hidden">
                {s.category ? (
                  <span className="truncate text-xs text-stone-400">
                    {s.category}
                  </span>
                ) : null}
                {s.isManual && (
                  <Badge
                    tone="Sərbəst"
                    className="shrink-0 px-1.5 py-0 text-[10px]"
                  >
                    Sərbəst
                  </Badge>
                )}
              </div>
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
        accessorKey: "salePrice",
        header: "Qiymət",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-stone-700">
            {fmtMoney(getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: "discount",
        header: "Endirim",
        meta: { className: "hidden xl:table-cell" },
        cell: ({ getValue }) => {
          const d = getValue() as number;
          return d > 0 ? (
            <span className="tabular-nums text-sm text-amber-700">
              {fmtMoney(d)}
            </span>
          ) : (
            <span className="text-stone-300">—</span>
          );
        },
      },
      {
        id: "xerc",
        header: "Xərc",
        cell: ({ row }) => {
          const s = row.original;
          const hasExpenses =
            s.isManual && (s.expenseItems?.length ?? 0) > 0;
          if (s.costPerUnit == null) {
            return (
              <div>
                <span className="text-stone-300">—</span>
                {hasExpenses && (
                  <p className="text-[10px] font-medium text-stone-400">
                    xərclə
                  </p>
                )}
              </div>
            );
          }
          return (
            <div>
              <span className="tabular-nums text-sm text-stone-700">
                {fmtMoney(s.costPerUnit * s.quantity)}
              </span>
              {hasExpenses && (
                <p className="text-[10px] font-medium text-stone-400">
                  xərclə
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "profit",
        header: "Qazanc",
        cell: ({ getValue }) => {
          const p = getValue() as number | null;
          if (p == null) {
            return <span className="text-stone-400">—</span>;
          }
          return (
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                p < 0 ? "text-red-600" : "text-emerald-700",
              )}
            >
              {p >= 0 ? "+" : ""}
              {fmtMoney(p)}
            </span>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: "Yekun",
        cell: ({ getValue }) => (
          <span className="text-base font-bold tabular-nums text-stone-900">
            {fmtMoney(getValue() as number)}
          </span>
        ),
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
    ],
    [sellerName],
  );

  const clearFilters = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        period: "today",
        pay: undefined,
        minProfit: undefined,
        maxProfit: undefined,
        minQty: undefined,
        maxQty: undefined,
      }),
    });
  };

  const exportPdf = async () => {
    if (USE_MOCK) {
      toast.info("Export real backend rejimində işləyir");
      return;
    }
    const { from, to } = periodToRange(period);
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

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
      <div className="space-y-3 border-b border-stone-100 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="shrink-0 text-base font-bold text-stone-800">
            Satışlar
          </h2>
          <div className="relative w-full max-w-[220px] sm:max-w-[260px]">
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              value={q ?? ""}
              onChange={(e) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    q: e.target.value || undefined,
                  }),
                })
              }
              placeholder="Axtar..."
              className={cn(inputCls, "h-9 pl-8 text-sm")}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-2">
          <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-stone-200 bg-stone-50/60">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700">
                <SlidersHorizontal size={16} className="text-stone-500" />
                Filterlər
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <ChevronDown
                size={18}
                className={cn(
                  "shrink-0 text-stone-400 transition-transform",
                  filtersOpen && "rotate-180",
                )}
              />
            </button>

          {filtersOpen && (
            <div className="space-y-3 border-t border-stone-200 px-3 py-3">
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-stone-400">
                  Dövr
                </p>
                <div
                  role="tablist"
                  aria-label="Dövr"
                  className="flex w-full min-w-0 flex-nowrap gap-0.5 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1"
                >
                  {PERIODS.map((p) => {
                    const active = period === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() =>
                          navigate({
                            search: (prev) => ({ ...prev, period: p }),
                          })
                        }
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-emerald-700 text-white shadow-sm"
                            : "text-stone-500 hover:bg-stone-50 hover:text-stone-800",
                        )}
                      >
                        {PERIOD_LABELS[p]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-semibold text-stone-500">
                    Ödəniş
                  </label>
                  <Select
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
                    className="h-9 w-full text-sm"
                  >
                    <option value="">Hamısı</option>
                    <option value="Nağd">Nağd</option>
                    <option value="Kart">Kart</option>
                    <option value="Nisyə">Nisyə</option>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">
                    Min qazanc
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
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
                    className={cn(inputCls, "h-9 px-3 text-sm")}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">
                    Max qazanc
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
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
                    className={cn(inputCls, "h-9 px-3 text-sm")}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">
                    Min say
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
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
                    className={cn(inputCls, "h-9 px-3 text-sm")}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">
                    Max say
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
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
                    className={cn(inputCls, "h-9 px-3 text-sm")}
                  />
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-semibold text-stone-500 hover:text-emerald-700"
                  >
                    Filterləri sıfırla
                  </button>
                </div>
              )}
            </div>
          )}
          </div>

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
                <span className="shrink-0 text-sm font-bold tabular-nums text-stone-900">
                  {fmtMoney(s.totalAmount)}
                </span>
              </div>
              <div className="mt-1 flex flex-nowrap items-center gap-1.5 overflow-hidden">
                {s.category ? (
                  <span className="truncate text-xs text-stone-400">
                    {s.category}
                  </span>
                ) : null}
                {s.isManual && (
                  <Badge
                    tone="Sərbəst"
                    className="shrink-0 px-1.5 py-0 text-[10px]"
                  >
                    Sərbəst
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-xs tabular-nums text-stone-400">
                  {s.quantity} × {fmtMoney(s.salePrice)}
                </span>
                <span className="text-xs tabular-nums text-stone-400">
                  Xərc:{" "}
                  {s.costPerUnit != null
                    ? fmtMoney(s.costPerUnit * s.quantity)
                    : "—"}
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
            </div>
          )}
        />
      </div>

      <SaleDetailDrawer
        saleId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
