import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, HandCoins, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { CopyablePhone } from "@/components/ui/CopyablePhone";
import { fmtMoney, fmtDate } from "@/lib/format";
import { useSettingsStore } from "@/features/settings/store";
import { waLink } from "../lib";
import type { Customer } from "@/types";

interface Props {
  customers: Customer[];
  isLoading?: boolean;
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
}

/** Son alış / son ödənişdən ən yenisi. */
function lastActivityDate(c: Customer): string {
  const a = c.lastPurchaseDate || "";
  const b = c.lastPaymentDate || "";
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
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
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        <HandCoins size={14} />
        Ödəniş
      </button>
      <ActionMenu items={menuItems} aria-label={`${customer.name} əməliyyatları`} />
    </div>
  );
}

export function CustomersTable({
  customers,
  isLoading,
  canEdit = false,
  canDelete = false,
  onView,
  onPay,
  onEdit,
  onDelete,
  emptyState,
  variant = "debtors",
}: Props) {
  const waTemplate = useSettingsStore((s) => s.whatsappTemplate);
  const columns = useMemo<ColumnDef<Customer, unknown>[]>(() => {
    const base: ColumnDef<Customer, unknown>[] = [
      {
        accessorKey: "name",
        header: "Müştəri",
        cell: ({ getValue }) => (
          <span className="font-semibold text-stone-900">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Telefon",
        cell: ({ getValue }) => (
          <CopyablePhone phone={(getValue() as string) || ""} />
        ),
      },
    ];

    const debtCol: ColumnDef<Customer, unknown> = {
      accessorKey: "remainingDebt",
      header: "Qalıq borc",
      cell: ({ getValue }) => {
        const debt = getValue() as number;
        if (debt <= 0)
          return (
            <span className="tabular-nums text-stone-400">—</span>
          );
        return (
          <span className="font-bold tabular-nums text-red-600">
            {fmtMoney(debt)}
          </span>
        );
      },
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
      cell: ({ getValue }) => fmtDate((getValue() as string) || ""),
    };

    const lastActivityCol: ColumnDef<Customer, unknown> = {
      id: "lastActivity",
      accessorFn: (c) => lastActivityDate(c),
      header: "Son əməliyyat",
      cell: ({ getValue }) => fmtDate((getValue() as string) || ""),
    };

    const statusCol: ColumnDef<Customer, unknown> = {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const debt = row.original.remainingDebt;
        return (
          <Badge tone={debt > 0 ? "Borclu" : "Ödənilib"}>
            {debt > 0 ? "Borclu" : "Ödənilib"}
          </Badge>
        );
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
      emptyState={
        emptyState ?? {
          title: "Hələ müştəri yoxdur",
          description: "Yuxarıdakı «Yeni müştəri» düyməsi ilə əlavə edin.",
        }
      }
      mobileCard={(c) => {
        const debt = c.remainingDebt;
        return (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-stone-900">
                  {c.name}
                </p>
                <CopyablePhone
                  phone={c.phone || ""}
                  className="mt-0.5 text-left text-sm tabular-nums text-stone-400 underline-offset-2 hover:text-emerald-700 hover:underline"
                />
              </div>
              <Badge tone={debt > 0 ? "Borclu" : "Ödənilib"}>
                {debt > 0 ? "Borclu" : "Ödənilib"}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-stone-500">
                Qalıq borc
              </span>
              <span
                className={`text-xl font-bold tabular-nums ${
                  debt > 0 ? "text-red-600" : "text-emerald-700"
                }`}
              >
                {fmtMoney(debt)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
              <button
                onClick={() => onPay(c)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-base font-semibold text-emerald-700 active:bg-emerald-100"
              >
                <HandCoins size={18} /> Ödəniş
              </button>
              <button
                onClick={() => onView(c)}
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
