import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, HandCoins, MessageCircle, Pencil, Phone, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { fmtMoney, fmtDate } from "@/lib/format";
import { formatPhoneDisplay, phoneDigits } from "@/lib/phone";
import { useSettingsStore } from "@/features/settings/store";
import { waLink } from "../lib";
import type { Customer } from "@/types";

async function copyPhone(phone: string): Promise<boolean> {
  const digits = phoneDigits(phone);
  if (!digits) return false;
  const text = `+${digits}`;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyablePhone({
  phone,
  className,
}: {
  phone: string;
  className?: string;
}) {
  const toast = useToast();
  const digits = phoneDigits(phone);
  const display = formatPhoneDisplay(phone) || phone;

  if (!digits) {
    return <span className={className}>—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={`tel:+${digits}`}
        title="Zəng et"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-50"
      >
        <Phone size={13} />
      </a>
      <button
        type="button"
        title="Kopyalamaq üçün klikləyin"
        onClick={async (e) => {
          e.stopPropagation();
          const ok = await copyPhone(phone);
          if (ok) toast.success("Nömrə kopyalandı");
          else toast.error("Nömrə kopyalanmadı");
        }}
        className={cn(
          "text-left tabular-nums underline-offset-2 hover:text-emerald-700 hover:underline",
          className ?? "text-xs text-stone-600",
        )}
      >
        {display}
      </button>
    </span>
  );
}

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
}: Props) {
  const waTemplate = useSettingsStore((s) => s.whatsappTemplate);
  const columns = useMemo<ColumnDef<Customer, unknown>[]>(
    () => [
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
      {
        accessorKey: "remainingDebt",
        header: "Qalıq borc",
        cell: ({ getValue }) => {
          const debt = getValue() as number;
          return (
            <span
              className={`font-bold tabular-nums ${
                debt > 0 ? "text-red-600" : "text-emerald-700"
              }`}
            >
              {fmtMoney(debt)}
            </span>
          );
        },
      },
      {
        id: "lastActivity",
        accessorFn: (c) => lastActivityDate(c),
        header: "Son əməliyyat",
        cell: ({ getValue }) => fmtDate((getValue() as string) || ""),
      },
      {
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
      },
      {
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
      },
    ],
    [onView, onPay, onEdit, onDelete, canEdit, canDelete, waTemplate],
  );

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
