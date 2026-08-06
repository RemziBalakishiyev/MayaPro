import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, HandCoins, MessageCircle } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { CopyablePhone } from "@/components/ui/CopyablePhone";
import { fmtMoney, fmtDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useSettingsStore } from "@/features/settings/store";
import {
  debtAgeTone,
  waLink,
  type DebtAgeTone,
  type DebtPaymentContext,
} from "../lib";
import type { Customer, OpenDebt } from "@/types";

interface Props {
  debts: OpenDebt[];
  isLoading?: boolean;
  /**
   * FE#87 (TC-32.9/32.10): açıq borc sorğusu şəbəkə xətası ilə uğursuz
   * olduqda boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən" göstərilir.
   */
  isError?: boolean;
  onRetry?: () => void;
  /** customerId → tam müştəri qeydi (Ödəniş al / WhatsApp / drawer üçün). */
  customersById: Map<string, Customer>;
  /**
   * FE#74 (AC13) — sətrin `OpenDebt` mənbəyi (mal adı/tarix) `PaymentModal`-a
   * kontekst kimi ötürülür ki, "Borclar" cədvəlindən açılan ödəniş modalında
   * hansı borcdan gəldiyi göstərilsin.
   */
  onPay: (customer: Customer, context: DebtPaymentContext) => void;
  onView: (customer: Customer) => void;
  emptyState?: { title: string; description?: string };
  /** Xarici kart içində: border/shadow/radius yox (FE#63). */
  embedded?: boolean;
}

/**
 * FE#74 (AC8) — ciddilik pilləsinə görə mətn tonu. QIRMIZI rəng YALNIZ ən
 * kritik (çox köhnə) pillədə istifadə olunur və hər zaman mətn (+ kritik
 * pillədə ikon) müşayiəti ilə gəlir — rəng tək göstərici deyil.
 */
const DEBT_AGE_TONE_CLASS: Record<DebtAgeTone, string> = {
  neutral: "text-stone-400",
  warn: "text-amber-600",
  critical: "text-red-600",
};

function daysOldLabel(daysOld: number): string {
  return daysOld === 0 ? "Bu gün" : `${daysOld} gün əvvəl`;
}

/** Tarixin altındaki "N gün əvvəl" sətri — ciddilik tonuna görə rəng/ikon. */
function DebtAgeLine({
  daysOld,
  className,
}: {
  daysOld: number;
  className?: string;
}) {
  const tone = debtAgeTone(daysOld);
  return (
    <p
      className={cn(
        "flex items-center gap-1 font-medium tabular-nums",
        DEBT_AGE_TONE_CLASS[tone],
        className,
      )}
    >
      {tone === "critical" && (
        <AlertTriangle size={12} className="shrink-0" aria-hidden="true" />
      )}
      {daysOldLabel(daysOld)}
    </p>
  );
}

/**
 * FE#40 — "Borclar" görünüşü: BE#21 `GET /api/customers/open-debts`
 * sətirləri, mənbə-mənbə (ilkin borc / hər qalıqlı satış ayrı sətir).
 * `CustomersTable`-dəki mobileCard responsiv naxışı təkrarlanır.
 */
export function OpenDebtsTable({
  debts,
  isLoading,
  isError,
  onRetry,
  customersById,
  onPay,
  onView,
  emptyState,
  embedded,
}: Props) {
  const waTemplate = useSettingsStore((s) => s.whatsappTemplate);

  const columns = useMemo<ColumnDef<OpenDebt, unknown>[]>(
    () => [
      {
        id: "customer",
        header: "Müştəri",
        accessorFn: (d) => d.customerName,
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="min-w-0">
              <p className="truncate font-semibold text-stone-900">
                {d.customerName}
              </p>
              <CopyablePhone
                phone={d.phone || ""}
                className="text-xs text-stone-400"
              />
            </div>
          );
        },
      },
      {
        id: "description",
        header: "Nə üçün",
        accessorFn: (d) => d.description,
        cell: ({ row }) => (
          <span className="text-sm text-stone-700">
            {row.original.description}
          </span>
        ),
      },
      {
        id: "sourceDate",
        header: "Tarix",
        accessorFn: (d) => d.sourceDate,
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div>
              <p className="tabular-nums text-stone-700">
                {fmtDate(d.sourceDate)}
              </p>
              <DebtAgeLine daysOld={d.daysOld} className="text-xs" />
            </div>
          );
        },
      },
      {
        id: "remaining",
        header: "Qalıq",
        accessorFn: (d) => d.remaining,
        cell: ({ row }) => (
          <span className="font-bold tabular-nums text-red-600">
            {fmtMoney(row.original.remaining)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Əməliyyat",
        enableSorting: false,
        cell: ({ row }) => {
          const d = row.original;
          const customer = customersById.get(d.customerId);
          return (
            <div
              className="flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* FE#74 (AC12) — "Ödəniş al" sətrin əsas əməliyyatıdır: dolu
                  yaşıl fon (Xatırlat-dan vizual olaraq daha güclü). */}
              <button
                type="button"
                disabled={!customer}
                title={
                  customer
                    ? `${d.customerName} — Ödəniş al`
                    : "Müştəri məlumatı tapılmadı"
                }
                onClick={() =>
                  customer &&
                  onPay(customer, {
                    description: d.description,
                    sourceDate: d.sourceDate,
                  })
                }
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HandCoins size={14} />
                Ödəniş al
              </button>
              {/* FE#74 (AC10) — yalnız-ikon linkdən açıq etiketə keçid:
                  ikon + görünən "Xatırlat" mətni. */}
              <a
                href={waLink(
                  d.phone || "",
                  customer?.remainingDebt ?? d.remaining,
                  waTemplate,
                )}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${d.customerName} — Xatırlat`}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-200"
              >
                <MessageCircle size={14} />
                Xatırlat
              </a>
            </div>
          );
        },
      },
    ],
    [customersById, onPay, waTemplate],
  );

  return (
    <DataTable
      columns={columns}
      data={debts}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      errorMessage="Borclar yüklənmədi"
      embedded={embedded}
      onRowClick={(d) => {
        const customer = customersById.get(d.customerId);
        if (customer) onView(customer);
      }}
      emptyState={
        emptyState ?? {
          title: "Açıq borc yoxdur",
          description: "Bütün müştərilər hesablaşıb.",
        }
      }
      mobileCard={(d) => {
        const customer = customersById.get(d.customerId);
        return (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-stone-900">
                  {d.customerName}
                </p>
                <CopyablePhone
                  phone={d.phone || ""}
                  className="mt-0.5 text-left text-sm tabular-nums text-stone-400 underline-offset-2 hover:text-emerald-700 hover:underline"
                />
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular-nums text-xs text-stone-400">
                  {fmtDate(d.sourceDate)}
                </p>
                <DebtAgeLine
                  daysOld={d.daysOld}
                  className="justify-end text-xs font-semibold"
                />
              </div>
            </div>
            <p className="mt-2 truncate text-sm text-stone-600">
              {d.description}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-stone-500">
                Qalıq
              </span>
              <span className="text-xl font-bold tabular-nums text-red-600">
                {fmtMoney(d.remaining)}
              </span>
            </div>
            <div
              className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={!customer}
                title={
                  customer
                    ? `${d.customerName} — Ödəniş al`
                    : "Müştəri məlumatı tapılmadı"
                }
                onClick={() =>
                  customer &&
                  onPay(customer, {
                    description: d.description,
                    sourceDate: d.sourceDate,
                  })
                }
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-base font-semibold text-white active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HandCoins size={18} /> Ödəniş al
              </button>
              <a
                href={waLink(
                  d.phone || "",
                  customer?.remainingDebt ?? d.remaining,
                  waTemplate,
                )}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${d.customerName} — Xatırlat`}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 text-base font-semibold text-stone-700 active:bg-stone-200"
              >
                <MessageCircle size={18} /> Xatırlat
              </a>
            </div>
          </div>
        );
      }}
    />
  );
}
