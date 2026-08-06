import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, HandCoins, Plus, Pencil, Trash2 } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { Badge } from "@/components/ui/Badge";
import { CopyablePhone } from "@/components/ui/CopyablePhone";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyValue } from "@/components/ui/EmptyValue";
import { cn } from "@/lib/cn";
import { fmtMoney, fmtDate } from "@/lib/format";
import {
  DEBT_NUMBER_CLASS,
  DEBT_TONE_LABEL,
  debtAgeDays,
  debtTone,
} from "./debt-presentation";
import type { Supplier } from "@/types";

interface Props {
  suppliers: Supplier[];
  isLoading?: boolean;
  /**
   * FE#87 (TC-32.5/32.6): təchizatçı sorğusu şəbəkə xətası ilə uğursuz
   * olduqda boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən" göstərilir.
   */
  isError?: boolean;
  onRetry?: () => void;
  canWrite?: boolean;
  onView: (supplier: Supplier) => void;
  onAddDebt: (supplier: Supplier) => void;
  onPay: (supplier: Supplier) => void;
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
  /** FE#75 — axtarış/seqment nəticəsiz qaldıqda fərqli boş-vəziyyət mesajı. */
  emptyState?: { title: string; description?: string };
}

/**
 * Qalıq borc rəqəmi — DS 9-cu qayda: rəng tək göstərici deyil, rəqəmin
 * altında mətnli badge də göstərilir (FE#75, `debt-presentation.ts`).
 */
function DebtAmount({ supplier }: { supplier: Supplier }) {
  const debt = supplier.remainingDebt;
  const tone = debtTone(debt, debtAgeDays(supplier));
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={cn("tabular-nums font-bold", DEBT_NUMBER_CLASS[tone])}>
        {fmtMoney(debt)}
      </span>
      {tone !== "none" && (
        <Badge tone={DEBT_TONE_LABEL[tone]} className="text-[10px]">
          {DEBT_TONE_LABEL[tone]}
        </Badge>
      )}
    </div>
  );
}

function SupplierRowActions({
  supplier,
  canWrite,
  onView,
  onAddDebt,
  onPay,
  onEdit,
  onDelete,
}: {
  supplier: Supplier;
  canWrite: boolean;
  onView: (s: Supplier) => void;
  onAddDebt: (s: Supplier) => void;
  onPay: (s: Supplier) => void;
  onEdit?: (s: Supplier) => void;
  onDelete?: (s: Supplier) => void;
}) {
  const menuItems: ActionMenuItem[] = [
    {
      label: "Detal",
      icon: <Eye size={15} />,
      onClick: () => onView(supplier),
    },
    {
      label: "Borc əlavə et",
      icon: <Plus size={15} />,
      onClick: () => onAddDebt(supplier),
    },
    ...(canWrite && onEdit
      ? [
          {
            label: "Düzəliş",
            icon: <Pencil size={15} />,
            onClick: () => onEdit(supplier),
          } satisfies ActionMenuItem,
        ]
      : []),
    ...(canWrite && onDelete
      ? [
          {
            label: "Sil",
            icon: <Trash2 size={15} />,
            onClick: () => onDelete(supplier),
            tone: "danger" as const,
          } satisfies ActionMenuItem,
        ]
      : []),
  ];

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onPay(supplier)}
        title={`${supplier.name} — təchizatçıya ödəniş et`}
        aria-label={`${supplier.name} — təchizatçıya ödəniş et`}
        className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        <HandCoins size={14} />
        Təchizatçıya ödəniş et
      </button>
      <ActionMenu
        items={menuItems}
        aria-label={`${supplier.name} əməliyyatları`}
      />
    </div>
  );
}

export function SuppliersTable({
  suppliers,
  isLoading,
  isError,
  onRetry,
  canWrite = false,
  onView,
  onAddDebt,
  onPay,
  onEdit,
  onDelete,
  emptyState,
}: Props) {
  const columns = useMemo<ColumnDef<Supplier, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Təchizatçı",
        // FE#75 — adın BÜTÖVÜ kliklənəndir, `SupplierDrawer`-i açır
        // (Müştərilər səhifəsindəki FE#73 naxışı ilə eyni).
        cell: ({ row }) => {
          const s = row.original;
          return (
            <button
              type="button"
              onClick={() => onView(s)}
              title={`${s.name} — təchizatçı detalına bax`}
              aria-label={`${s.name} — təchizatçı detalına bax`}
              className="focus-ring-inset rounded-chip text-left font-semibold text-stone-900 underline-offset-2 hover:text-emerald-700 hover:underline"
            >
              {s.name}
            </button>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Əlaqə",
        cell: ({ getValue }) => (
          <CopyablePhone
            phone={(getValue() as string) || ""}
            className="text-xs text-stone-600"
          />
        ),
      },
      {
        accessorKey: "itemCount",
        header: () => (
          <span title="Bu təchizatçıdan alınan mallar">Bağlı mal sayı</span>
        ),
        cell: ({ getValue }) => (
          <span
            title="Bu təchizatçıdan alınan mallar"
            className="tabular-nums font-semibold text-stone-700"
          >
            {(getValue() as number) ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "remainingDebt",
        header: "Mənim borcum",
        cell: ({ row }) => <DebtAmount supplier={row.original} />,
      },
      {
        accessorKey: "lastPaymentDate",
        header: "Son ödəniş",
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return v ? (
            fmtDate(v)
          ) : (
            <EmptyValue label="son ödəniş tarixi yoxdur" />
          );
        },
      },
      {
        id: "actions",
        header: "Əməliyyat",
        enableSorting: false,
        cell: ({ row }) => (
          <SupplierRowActions
            supplier={row.original}
            canWrite={canWrite}
            onView={onView}
            onAddDebt={onAddDebt}
            onPay={onPay}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [onView, onAddDebt, onPay, onEdit, onDelete, canWrite],
  );

  return (
    <DataTable
      columns={columns}
      data={suppliers}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      errorMessage="Təchizatçılar yüklənmədi"
      emptyState={
        emptyState ?? {
          title: "Hələ təchizatçı yoxdur",
          description: "Yuxarıdakı «Yeni təchizatçı» düyməsi ilə əlavə edin.",
        }
      }
      mobileCard={(s) => {
        const tone = debtTone(s.remainingDebt, debtAgeDays(s));
        const toneLabel = DEBT_TONE_LABEL[tone];
        return (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onView(s)}
                  title={`${s.name} — təchizatçı detalına bax`}
                  aria-label={`${s.name} — təchizatçı detalına bax`}
                  className="focus-ring-inset block truncate rounded-chip text-left text-lg font-bold text-stone-900 hover:text-emerald-700 hover:underline"
                >
                  {s.name}
                </button>
                <CopyablePhone
                  phone={s.phone || ""}
                  className="mt-0.5 text-left text-sm tabular-nums text-stone-400 underline-offset-2 hover:text-emerald-700 hover:underline"
                />
                <p
                  title="Bu təchizatçıdan alınan mallar"
                  className="mt-0.5 text-xs text-stone-400"
                >
                  {s.itemCount} bağlı mal
                </p>
              </div>
              {tone !== "none" && <Badge tone={toneLabel}>{toneLabel}</Badge>}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-stone-500">
                Mənim borcum
              </span>
              <span
                className={cn(
                  "text-xl font-bold tabular-nums",
                  DEBT_NUMBER_CLASS[tone],
                )}
              >
                {fmtMoney(s.remainingDebt)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
              <button
                onClick={() => onPay(s)}
                title={`${s.name} — təchizatçıya ödəniş et`}
                aria-label={`${s.name} — təchizatçıya ödəniş et`}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-2 text-center text-sm font-semibold leading-tight text-emerald-700 active:bg-emerald-100"
              >
                <HandCoins size={18} className="shrink-0" />
                <span>Təchizatçıya ödəniş et</span>
              </button>
              <button
                onClick={() => onAddDebt(s)}
                title={`${s.name} — borc əlavə et`}
                aria-label={`${s.name} — borc əlavə et`}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-50 text-base font-semibold text-amber-700 active:bg-amber-100"
              >
                <Plus size={18} /> Borc
              </button>
              <ActionMenu
                items={[
                  {
                    label: "Detal",
                    icon: <Eye size={15} />,
                    onClick: () => onView(s),
                  },
                  ...(canWrite && onEdit
                    ? [
                        {
                          label: "Düzəliş",
                          icon: <Pencil size={15} />,
                          onClick: () => onEdit(s),
                        } satisfies ActionMenuItem,
                      ]
                    : []),
                  ...(canWrite && onDelete
                    ? [
                        {
                          label: "Sil",
                          icon: <Trash2 size={15} />,
                          onClick: () => onDelete(s),
                          tone: "danger" as const,
                        } satisfies ActionMenuItem,
                      ]
                    : []),
                ]}
                aria-label={`${s.name} əməliyyatları`}
              />
            </div>
          </div>
        );
      }}
    />
  );
}
