import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, HandCoins, MessageCircle } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { fmtMoney, fmtDate } from "@/lib/format";
import { waLink } from "../lib";
import type { Customer } from "@/types";

interface Props {
  customers: Customer[];
  isLoading?: boolean;
  onView: (customer: Customer) => void;
  onPay: (customer: Customer) => void;
}

export function CustomersTable({ customers, isLoading, onView, onPay }: Props) {
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
          <span className="text-xs">{(getValue() as string) || "—"}</span>
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
        accessorKey: "lastPurchaseDate",
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
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex justify-end gap-1">
              <button
                title="Detal"
                onClick={() => onView(c)}
                className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
              >
                <Eye size={15} />
              </button>
              <button
                title="Ödəniş"
                onClick={() => onPay(c)}
                className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-50"
              >
                <HandCoins size={15} />
              </button>
              {c.remainingDebt > 0 && (
                <a
                  title="WhatsApp xatırlatma"
                  href={waLink(c.phone, c.remainingDebt)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
                >
                  <MessageCircle size={15} />
                </a>
              )}
            </div>
          );
        },
      },
    ],
    [onView, onPay],
  );

  return (
    <DataTable
      columns={columns}
      data={customers}
      isLoading={isLoading}
      emptyState={{ title: "Müştəri tapılmadı" }}
    />
  );
}
