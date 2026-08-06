import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, HandCoins, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { CopyablePhone } from "@/components/ui/CopyablePhone";
import { EmptyValue } from "@/components/ui/EmptyValue";
import { cn } from "@/lib/cn";
import { fmtMoney, fmtDate } from "@/lib/format";
import { useSettingsStore } from "@/features/settings/store";
import { waLink } from "../lib";
import {
  DEBT_NUMBER_CLASS,
  DEBT_TONE_LABEL,
  debtAgeDays,
  debtTone,
} from "./debt-presentation";
import type { Customer } from "@/types";

interface Props {
  customers: Customer[];
  isLoading?: boolean;
  /**
   * FE#87 (TC-32.3/32.4, TC-32.9/32.10): müştəri sorğusu şəbəkə xətası ilə
   * uğursuz olduqda boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən" göstərilir.
   */
  isError?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onView: (customer: Customer) => void;
  onPay: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  emptyState?: { title: string; description?: string };
  /**
   * "debtors" — Nisyə Borclar üçün (qalıq borc, status);
   * "all" — Müştərilər üçün (ümumi alış, alış sayı, qalıq borc);
   */
  variant?: "debtors" | "all";
  /** Xarici kart içində: border/shadow/radius yox (FE#63). */
  embedded?: boolean;
}

/** Son alış / son ödənişdən ən yenisi. */
function lastActivityDate(c: Customer): string {
  const a = c.lastPurchaseDate || "";
  const b = c.lastPaymentDate || "";
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/**
 * Qalıq borc rəqəmi — DS 9-cu qayda: rəng tək göstərici deyil, ona görə
 * `withBadge=true` olduqda (variant="all" — ayrıca Status sütunu yoxdur)
 * rəqəmin altında mətnli badge də göstərilir (FE#73, bənd 9).
 */
function DebtAmount({
  customer,
  withBadge,
}: {
  customer: Customer;
  withBadge?: boolean;
}) {
  const debt = customer.remainingDebt;
  const tone = debtTone(debt, debtAgeDays(customer));
  const numberCls = cn(
    "tabular-nums font-bold",
    tone === "none" && !withBadge ? "font-semibold" : undefined,
    DEBT_NUMBER_CLASS[tone],
  );
  if (tone === "none") {
    return <span className={numberCls}>{fmtMoney(debt)}</span>;
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={numberCls}>{fmtMoney(debt)}</span>
      {withBadge && (
        <Badge tone={DEBT_TONE_LABEL[tone]} className="text-[10px]">
          {DEBT_TONE_LABEL[tone]}
        </Badge>
      )}
    </div>
  );
}

function CustomerRowActions({
  customer,
  canEdit,
  canDelete,
  onView,
  onPay,
  onEdit,
  onDelete,
  waTemplate,
}: {
  customer: Customer;
  canEdit: boolean;
  canDelete: boolean;
  onView: (c: Customer) => void;
  onPay: (c: Customer) => void;
  onEdit?: (c: Customer) => void;
  onDelete?: (c: Customer) => void;
  waTemplate: string;
}) {
  const hasDebt = customer.remainingDebt > 0;

  const menuItems: ActionMenuItem[] = [
    {
      label: "Detal",
      icon: <Eye size={15} />,
      onClick: () => onView(customer),
    },
    ...(canEdit && onEdit
      ? [
          {
            label: "Düzəliş",
            icon: <Pencil size={15} />,
            onClick: () => onEdit(customer),
          } satisfies ActionMenuItem,
        ]
      : []),
    ...(hasDebt
      ? [
          {
            label: "WhatsApp",
            icon: <MessageCircle size={15} />,
            href: waLink(customer.phone, customer.remainingDebt, waTemplate),
            tone: "success" as const,
          } satisfies ActionMenuItem,
        ]
      : []),
    ...(canDelete && onDelete
      ? [
          {
            label: "Sil",
            icon: <Trash2 size={15} />,
            onClick: () => onDelete(customer),
            tone: "danger" as const,
          } satisfies ActionMenuItem,
        ]
      : []),
  ];

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onPay(customer)}
        title={`${customer.name} — borc ödənişi al`}
        aria-label={`${customer.name} — borc ödənişi al`}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        <HandCoins size={14} />
        Borc ödənişi al
      </button>
      <ActionMenu items={menuItems} aria-label={`${customer.name} əməliyyatları`} />
    </div>
  );
}

export function CustomersTable({
  customers,
  isLoading,
  isError,
  onRetry,
  errorMessage = "Müştərilər yüklənmədi",
  canEdit = false,
  canDelete = false,
  onView,
  onPay,
  onEdit,
  onDelete,
  emptyState,
  variant = "debtors",
  embedded,
}: Props) {
  const waTemplate = useSettingsStore((s) => s.whatsappTemplate);
  const columns = useMemo<ColumnDef<Customer, unknown>[]>(() => {
    const base: ColumnDef<Customer, unknown>[] = [
      {
        accessorKey: "name",
        header: "Müştəri",
        // FE#73 (bənd 5) — adın BÜTÖVÜ kliklənəndir, ayrıca "Detal" düyməsinə
        // ehtiyac qalmadan `CustomerDrawer` açır (`ActionMenu`-dəki "Detal"
        // bəndi alternativ yol kimi qalır).
        cell: ({ row }) => {
          const c = row.original;
          return (
            <button
              type="button"
              onClick={() => onView(c)}
              title={`${c.name} — müştəri detalına bax`}
              aria-label={`${c.name} — müştəri detalına bax`}
              className="focus-ring-inset rounded-chip text-left font-semibold text-stone-900 underline-offset-2 hover:text-emerald-700 hover:underline"
            >
              {c.name}
            </button>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Telefon",
        cell: ({ getValue }) => (
          <CopyablePhone phone={(getValue() as string) || ""} />
        ),
      },
    ];

    // FE#73 (bənd 9/10) — borc rənginin qaydası `debt-presentation.ts`-dədir;
    // "all" variantında (Müştərilər) ayrıca Status sütunu yoxdur, ona görə
    // badge rəqəmin altında göstərilir. "debtors" variantında (Nisyə
    // Borclar → Müştəri üzrə) badge aşağıdakı `statusCol`-dadır — təkrar
    // olunmasın deyə burada göstərilmir.
    const debtCol: ColumnDef<Customer, unknown> = {
      accessorKey: "remainingDebt",
      header: "Qalıq borc",
      cell: ({ row }) => (
        <DebtAmount customer={row.original} withBadge={variant === "all"} />
      ),
    };

    const purchasesCols: ColumnDef<Customer, unknown>[] = [
      {
        accessorKey: "totalPurchases",
        header: "Ümumi alış",
        cell: ({ getValue }) => (
          <span className="font-semibold tabular-nums text-stone-800">
            {fmtMoney(getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: "purchaseCount",
        header: "Alış sayı",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-stone-600">
            {getValue() as number}
          </span>
        ),
      },
    ];

    const lastPurchaseCol: ColumnDef<Customer, unknown> = {
      accessorKey: "lastPurchaseDate",
      header: "Son alış",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v ? fmtDate(v) : <EmptyValue label="son alış tarixi yoxdur" />;
      },
    };

    const lastActivityCol: ColumnDef<Customer, unknown> = {
      id: "lastActivity",
      accessorFn: (c) => lastActivityDate(c),
      header: "Son əməliyyat",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v ? fmtDate(v) : <EmptyValue label="son əməliyyat yoxdur" />;
      },
    };

    // FE#73 (bənd 9) — "debtors" variantında (Nisyə Borclar → Müştəri üzrə)
    // status nişanı indi 4 dərəcəlidir: Ödənilib / Borclu / Gecikmiş borc /
    // Kritik borc (`debt-presentation.ts`) — əvvəlki 2 dərəcəli (yalnız
    // Borclu/Ödənilib) ƏVƏZİNƏ, HƏR borclunun eyni "qırmızı" görünməsinin
    // qarşısını alır.
    const statusCol: ColumnDef<Customer, unknown> = {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        const label = DEBT_TONE_LABEL[debtTone(c.remainingDebt, debtAgeDays(c))];
        return <Badge tone={label}>{label}</Badge>;
      },
    };

    const actionsCol: ColumnDef<Customer, unknown> = {
      id: "actions",
      header: "Əməliyyat",
      enableSorting: false,
      cell: ({ row }) => (
        <CustomerRowActions
          customer={row.original}
          canEdit={canEdit}
          canDelete={canDelete}
          onView={onView}
          onPay={onPay}
          onEdit={onEdit}
          onDelete={onDelete}
          waTemplate={waTemplate}
        />
      ),
    };

    if (variant === "all") {
      return [...base, ...purchasesCols, debtCol, lastPurchaseCol, actionsCol];
    }
    return [...base, debtCol, lastActivityCol, statusCol, actionsCol];
  }, [onView, onPay, onEdit, onDelete, canEdit, canDelete, waTemplate, variant]);

  return (
    <DataTable
      columns={columns}
      data={customers}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      errorMessage={errorMessage}
      embedded={embedded}
      emptyState={
        emptyState ?? {
          title: "Hələ müştəri yoxdur",
          description: "Yuxarıdakı «Yeni müştəri» düyməsi ilə əlavə edin.",
        }
      }
      mobileCard={(c) => {
        const debt = c.remainingDebt;
        const tone = debtTone(debt, debtAgeDays(c));
        const toneLabel = DEBT_TONE_LABEL[tone];
        return (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* FE#73 (bənd 5) — adın bütövü kliklənəndir → CustomerDrawer */}
                <button
                  type="button"
                  onClick={() => onView(c)}
                  title={`${c.name} — müştəri detalına bax`}
                  aria-label={`${c.name} — müştəri detalına bax`}
                  className="focus-ring-inset block truncate rounded-chip text-left text-lg font-bold text-stone-900 hover:text-emerald-700 hover:underline"
                >
                  {c.name}
                </button>
                <CopyablePhone
                  phone={c.phone || ""}
                  className="mt-0.5 text-left text-sm tabular-nums text-stone-400 underline-offset-2 hover:text-emerald-700 hover:underline"
                />
              </div>
              <Badge tone={toneLabel}>{toneLabel}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-stone-500">
                Qalıq borc
              </span>
              <span
                className={cn(
                  "text-xl font-bold tabular-nums",
                  DEBT_NUMBER_CLASS[tone],
                )}
              >
                {fmtMoney(debt)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
              <button
                onClick={() => onPay(c)}
                title={`${c.name} — borc ödənişi al`}
                aria-label={`${c.name} — borc ödənişi al`}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-base font-semibold text-emerald-700 active:bg-emerald-100"
              >
                <HandCoins size={18} /> Borc ödənişi al
              </button>
              <button
                onClick={() => onView(c)}
                title={`${c.name} — detala bax`}
                aria-label={`${c.name} — detala bax`}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 text-base font-semibold text-stone-700 active:bg-stone-200"
              >
                <Eye size={18} /> Detal
              </button>
              <ActionMenu
                items={[
                  ...(canEdit && onEdit
                    ? [
                        {
                          label: "Düzəliş",
                          icon: <Pencil size={15} />,
                          onClick: () => onEdit(c),
                        } satisfies ActionMenuItem,
                      ]
                    : []),
                  ...(debt > 0
                    ? [
                        {
                          label: "WhatsApp",
                          icon: <MessageCircle size={15} />,
                          href: waLink(c.phone, debt, waTemplate),
                          tone: "success" as const,
                        } satisfies ActionMenuItem,
                      ]
                    : []),
                  ...(canDelete && onDelete
                    ? [
                        {
                          label: "Sil",
                          icon: <Trash2 size={15} />,
                          onClick: () => onDelete(c),
                          tone: "danger" as const,
                        } satisfies ActionMenuItem,
                      ]
                    : []),
                ]}
                aria-label={`${c.name} əməliyyatları`}
              />
            </div>
          </div>
        );
      }}
    />
  );
}
