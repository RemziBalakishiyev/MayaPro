import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Package, Plus, Minus, Pencil, Eye, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { profitPercent, firstAttrValue } from "../lib";
import { ProductStatusBadge } from "./ProductStatusBadge";
import type { Product } from "@/types";

export type StockMode = "add" | "sub";

/** Anbar yerini yığcam formata salır: "Anbar A / Rəf 3 / Qutu 12" → "A / R3 / Q12". */
const shortLocation = (p: Product): string => {
  const wh = (p.warehouse || "").split(" ").filter(Boolean).pop() || "";
  const parts = [wh, p.shelf && `R${p.shelf}`, p.box && `Q${p.box}`].filter(
    Boolean,
  );
  return parts.length ? parts.join(" / ") : p.location || "—";
};

interface Props {
  products: Product[];
  isLoading?: boolean;
  /** Redaktə (mal yeniləmə) icazəsi — satıcıda gizli. Stok düzəlişi hamıda qalır. */
  canEdit?: boolean;
  onEdit: (product: Product) => void;
  onAdjust: (product: Product, mode: StockMode) => void;
  onDelete?: (product: Product) => void;
}

export function ProductsTable({
  products,
  isLoading,
  canEdit = true,
  onEdit,
  onAdjust,
  onDelete,
}: Props) {
  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Mal",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <Link
              to="/mallar/$id"
              params={{ id: p.id }}
              className="flex items-center gap-2.5 hover:opacity-80"
            >
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
              <div className="min-w-0 max-w-[150px]">
                <p
                  className="truncate font-semibold text-stone-900 hover:text-emerald-700 hover:underline"
                  title={p.name}
                >
                  {p.name}
                </p>
                <p className="truncate text-[11px] text-stone-400">
                  {firstAttrValue(p)}
                </p>
              </div>
            </Link>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Kateqoriya",
        meta: { className: "hidden 2xl:table-cell" },
      },
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
        enableSorting: false,
        meta: { className: "hidden 2xl:table-cell" },
        cell: ({ row }) => (
          <span className="text-xs" title={row.original.location}>
            {shortLocation(row.original)}
          </span>
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
              <Link
                to="/mallar/$id"
                params={{ id: p.id }}
                title="Detallara bax"
                className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
              >
                <Eye size={15} />
              </Link>
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
              {canEdit && onDelete && (
                <button
                  title="Sil"
                  onClick={() => onDelete(p)}
                  className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [onEdit, onAdjust, onDelete, canEdit],
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
      mobileCard={(p) => {
        const loss = p.salePrice < p.realCostPerUnit;
        return (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <Link
                to="/mallar/$id"
                params={{ id: p.id }}
                className="min-w-0"
              >
                <p className="truncate text-lg font-bold text-stone-900">
                  {p.name}
                </p>
                {firstAttrValue(p) && (
                  <p className="truncate text-sm text-stone-400">
                    {firstAttrValue(p)}
                  </p>
                )}
              </Link>
              <ProductStatusBadge product={p} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-stone-50 py-2">
                <p className="text-xs font-medium text-stone-400">Stok</p>
                <p
                  className={cn(
                    "text-base font-bold tabular-nums",
                    p.quantity === 0
                      ? "text-red-600"
                      : p.quantity <= p.minStock
                        ? "text-amber-600"
                        : "text-stone-900",
                  )}
                >
                  {p.quantity}
                </p>
              </div>
              <div className="rounded-xl bg-stone-50 py-2">
                <p className="text-xs font-medium text-stone-400">Real maya</p>
                <p className="text-base font-bold tabular-nums whitespace-nowrap text-stone-900">
                  {fmtMoney(p.realCostPerUnit)}
                </p>
              </div>
              <div className="rounded-xl bg-stone-50 py-2">
                <p className="text-xs font-medium text-stone-400">Satış</p>
                <p
                  className={cn(
                    "text-base font-bold tabular-nums whitespace-nowrap",
                    loss ? "text-red-600" : "text-emerald-700",
                  )}
                >
                  {fmtMoney(p.salePrice)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
              <button
                onClick={() => onAdjust(p, "add")}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-base font-semibold text-emerald-700 active:bg-emerald-100"
              >
                <Plus size={18} /> Stok
              </button>
              <button
                onClick={() => onAdjust(p, "sub")}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-50 text-base font-semibold text-amber-700 active:bg-amber-100"
              >
                <Minus size={18} /> Stok
              </button>
              {canEdit && (
                <button
                  onClick={() => onEdit(p)}
                  aria-label="Redaktə et"
                  className="flex h-11 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-600 active:bg-stone-200"
                >
                  <Pencil size={18} />
                </button>
              )}
              {canEdit && onDelete && (
                <button
                  onClick={() => onDelete(p)}
                  aria-label="Sil"
                  className="flex h-11 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 active:bg-red-100"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
