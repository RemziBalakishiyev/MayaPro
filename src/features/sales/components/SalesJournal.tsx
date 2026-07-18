import { useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
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
import { useSalesJournal } from "../queries";
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

/** Satış jurnalı — filterlər + server pagination + DataTable. */
export function SalesJournal() {
  const toast = useToast();
  const navigate = routeApi.useNavigate();
  const { period, pay } = routeApi.useSearch();
  const { data: employees = [] } = useEmployees();
  const journal = useSalesJournal(period, pay);
  const [exportingPdf, setExportingPdf] = useState(false);

  const sellerName = useMemo(() => {
    const map = new Map(employees.map((e) => [e.id, e.name]));
    return (s: Sale) => s.soldByName || map.get(s.employeeId) || "—";
  }, [employees]);

  const sales = useMemo(
    () => journal.data?.pages.flatMap((p) => p.items) ?? [],
    [journal.data],
  );

  const totalCount = journal.data?.pages[0]?.totalCount ?? 0;

  const columns = useMemo<ColumnDef<Sale, unknown>[]>(
    () => [
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
        accessorKey: "productName",
        header: "Mal",
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="min-w-0 max-w-[200px]">
              <p className="truncate font-semibold text-stone-900">{s.productName}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {s.category ? (
                  <span className="text-xs text-stone-400">{s.category}</span>
                ) : null}
                {s.isManual && (
                  <Badge tone="Sərbəst" className="px-1.5 py-0 text-[10px]">
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
          <span className="tabular-nums">{fmtMoney(getValue() as number)}</span>
        ),
      },
      {
        accessorKey: "discount",
        header: "Endirim",
        meta: { className: "hidden xl:table-cell" },
        cell: ({ getValue }) => {
          const d = getValue() as number;
          return d > 0 ? (
            <span className="tabular-nums text-amber-700">{fmtMoney(d)}</span>
          ) : (
            <span className="text-stone-300">—</span>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: "Yekun",
        cell: ({ getValue }) => (
          <span className="font-bold tabular-nums text-stone-900">
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
                "font-semibold tabular-nums",
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
        id: "seller",
        header: "Satıcı",
        meta: { className: "hidden lg:table-cell" },
        cell: ({ row }) => (
          <span className="text-sm text-stone-600">
            {sellerName(row.original)}
          </span>
        ),
      },
    ],
    [sellerName],
  );

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
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-stone-800">Satışlar</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-stone-100 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() =>
                  navigate({ search: (prev) => ({ ...prev, period: p }) })
                }
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                  period === p
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-stone-500 hover:text-stone-700",
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
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
            className="h-9 w-[130px] text-sm"
          >
            <option value="">Ödəniş: hamısı</option>
            <option value="Nağd">Nağd</option>
            <option value="Kart">Kart</option>
            <option value="Nisyə">Nisyə</option>
          </Select>
          <Button
            variant="secondary"
            size="sm"
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

      <DataTable
        columns={columns}
        data={sales}
        isLoading={journal.isLoading}
        hidePagination
        emptyState={{
          title: "Satış yoxdur",
          description: "Seçilmiş filtrə uyğun satış tapılmadı.",
        }}
        mobileCard={(s) => (
          <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-card">
            <div className="flex items-baseline gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-stone-900">
                {s.productName}
                {s.category ? (
                  <span className="ml-1.5 font-normal text-stone-400">
                    {s.category}
                  </span>
                ) : null}
              </p>
              <span className="shrink-0 text-sm font-bold tabular-nums">
                {fmtMoney(s.totalAmount)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xs tabular-nums text-stone-400">
                {s.quantity} × {fmtMoney(s.salePrice)}
              </span>
              <Badge tone={s.paymentType} className="px-1.5 py-0.5 text-[11px]">
                {s.paymentType}
              </Badge>
              {s.isManual && (
                <Badge tone="Sərbəst" className="px-1.5 py-0.5 text-[11px]">
                  Sərbəst
                </Badge>
              )}
              <span className="ml-auto text-[11px] tabular-nums text-stone-400">
                {saleTime(s.createdAt)}
              </span>
            </div>
          </div>
        )}
      />

      {sales.length > 0 && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <p className="text-xs tabular-nums text-stone-400">
            {sales.length} / {totalCount} satış
          </p>
          {journal.hasNextPage && (
            <Button
              variant="secondary"
              size="lg"
              className="justify-center"
              disabled={journal.isFetchingNextPage}
              onClick={() => void journal.fetchNextPage()}
            >
              {journal.isFetchingNextPage ? "Yüklənir..." : "Daha çox yüklə"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
