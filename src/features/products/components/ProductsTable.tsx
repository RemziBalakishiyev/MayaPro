import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Package, Plus, Minus, Pencil } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { fmtMoney } from "@/lib/format";
import { profitPercent } from "../lib";
import { ProductStatusBadge } from "./ProductStatusBadge";
import type { Product } from "@/types";

export type StockMode = "add" | "sub";

interface Props {
  products: Product[];
  isLoading?: boolean;
  /** Redaktə (mal yeniləmə) icazəsi — satıcıda gizli. Stok düzəlişi hamıda qalır. */
  canEdit?: boolean;
  onEdit: (product: Product) => void;
  onAdjust: (product: Product, mode: StockMode) => void;
}

export function ProductsTable({
  products,
  isLoading,
  canEdit = true,
  onEdit,
  onAdjust,
}: Props) {
  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Mal",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
                {p.image ? (
                  <img
                    src={p.image}
                    alt=""
                    className="h-9 w-9 rounded-lg object-cover"
                  />
                ) : (
                  <Package size={16} />
                )}
              </div>
              <div>
                <p className="font-semibold text-stone-900">{p.name}</p>
                <p className="text-[11px] text-stone-400">{p.model}</p>
              </div>
            </div>
          );
        },
      },
      { accessorKey: "category", header: "Kateqoriya" },
      {
        accessorKey: "purchasePrice",
        header: "Alış",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{fmtMoney(getValue() as number)}</span>
        ),
      },
      {
        accessorKey: "realCostPerUnit",
        header: "Real maya",
        cell: ({ getValue }) => (
          <span className="font-bold tabular-nums text-stone-900">
            {fmtMoney(getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: "salePrice",
        header: "Satış",
        cell: ({ row, getValue }) => {
          const p = row.original;
          const loss = p.salePrice < p.realCostPerUnit;
          return (
            <span
              className={
                loss
                  ? "font-bold tabular-nums text-red-600"
                  : "font-semibold tabular-nums"
              }
            >
              {fmtMoney(getValue() as number)}
            </span>
          );
        },
      },
      {
        id: "profit",
        header: "Qazanc %",
        accessorFn: (p) => profitPercent(p.salePrice, p.realCostPerUnit),
        cell: ({ getValue }) => {
          const pct = getValue() as number;
          return (
            <span
              className={
                pct < 0
                  ? "font-semibold tabular-nums text-red-600"
                  : "font-semibold tabular-nums text-emerald-700"
              }
            >
              {pct.toFixed(1)} %
            </span>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: "Stok",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <span>
              <span
                className={`font-bold tabular-nums ${
                  p.quantity === 0
                    ? "text-red-600"
                    : p.quantity <= p.minStock
                      ? "text-amber-600"
                      : "text-stone-900"
                }`}
              >
                {p.quantity}
              </span>
              <span className="text-[11px] text-stone-400"> / min {p.minStock}</span>
            </span>
          );
        },
      },
      {
        accessorKey: "location",
        header: "Anbar yeri",
        cell: ({ getValue }) => (
          <span className="text-xs">{getValue() as string}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <ProductStatusBadge product={row.original} />,
      },
      {
        id: "actions",
        header: "Əməliyyat",
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex justify-end gap-1">
              <button
                title="Stok artır"
                onClick={() => onAdjust(p, "add")}
                className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-50"
              >
                <Plus size={15} />
              </button>
              <button
                title="Stok azalt"
                onClick={() => onAdjust(p, "sub")}
                className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
              >
                <Minus size={15} />
              </button>
              {canEdit && (
                <button
                  title="Redaktə et"
                  onClick={() => onEdit(p)}
                  className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
                >
                  <Pencil size={15} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [onEdit, onAdjust, canEdit],
  );

  return (
    <DataTable
      columns={columns}
      data={products}
      isLoading={isLoading}
      emptyState={{
        title: "Mal tapılmadı",
        description: "Filterləri dəyişin və ya yeni mal əlavə edin.",
      }}
    />
  );
}
