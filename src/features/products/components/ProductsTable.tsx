import { useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Package, Plus, Minus, Pencil, Eye, Trash2 } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyValue } from "@/components/ui/EmptyValue";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { profitPercent, firstAttrValue, hasNoBatchExpense } from "../lib";
import { ProductStatusBadge } from "./ProductStatusBadge";
import type { Product } from "@/types";

export type StockMode = "add" | "sub";

const NO_EXPENSE_HINT = "Xərc yoxdur — maya alış qiymətinə bərabərdir";

/**
 * Mal xanasının tooltip-i: kəsilmiş ad + anbar yeri
 * (yer sütunu cədvəldən çıxarıldığı üçün burada göstərilir).
 */
const productTooltip = (p: Product): string =>
  [p.name, p.location].filter(Boolean).join("\n");

interface Props {
  products: Product[];
  isLoading?: boolean;
  /** Redaktə (mal yeniləmə) icazəsi — satıcıda gizli. Stok düzəlişi hamıda qalır. */
  canEdit?: boolean;
  onEdit: (product: Product) => void;
  onAdjust: (product: Product, mode: StockMode) => void;
  onDelete?: (product: Product) => void;
}

function ProductRowActions({
  product,
  canEdit,
  onEdit,
  onAdjust,
  onDelete,
}: {
  product: Product;
  canEdit: boolean;
  onEdit: (p: Product) => void;
  onAdjust: (p: Product, mode: StockMode) => void;
  onDelete?: (p: Product) => void;
}) {
  const navigate = useNavigate();

  const menuItems: ActionMenuItem[] = [
    {
      label: "Detal",
      icon: <Eye size={15} />,
      onClick: () =>
        void navigate({ to: "/mallar/$id", params: { id: product.id } }),
    },
    {
      label: "Stok azalt",
      icon: <Minus size={15} />,
      onClick: () => onAdjust(product, "sub"),
    },
    ...(canEdit
      ? [
          {
            label: "Redaktə et",
            icon: <Pencil size={15} />,
            onClick: () => onEdit(product),
          } satisfies ActionMenuItem,
        ]
      : []),
    ...(canEdit && onDelete
      ? [
          {
            label: "Sil",
            icon: <Trash2 size={15} />,
            onClick: () => onDelete(product),
            tone: "danger" as const,
          } satisfies ActionMenuItem,
        ]
      : []),
  ];

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onAdjust(product, "add")}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        <Plus size={14} />
        Stok
      </button>
      <ActionMenu
        items={menuItems}
        aria-label={`${product.name} əməliyyatları`}
      />
    </div>
  );
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
              title={productTooltip(p)}
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
                <p className="truncate font-semibold text-stone-900 hover:text-emerald-700 hover:underline">
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
        cell: ({ row, getValue }) => {
          // Xərc yoxdursa alış = real maya → dəyəri iki sütunda təkrarlamırıq.
          if (hasNoBatchExpense(row.original)) {
            return (
              <EmptyValue label={NO_EXPENSE_HINT} title={NO_EXPENSE_HINT} />
            );
          }
          return (
            <span className="tabular-nums">
              {fmtMoney(getValue() as number)}
            </span>
          );
        },
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
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <ProductStatusBadge product={row.original} />,
      },
      {
        id: "actions",
        header: "Əməliyyat",
        enableSorting: false,
        cell: ({ row }) => (
          <ProductRowActions
            product={row.original}
            canEdit={canEdit}
            onEdit={onEdit}
            onAdjust={onAdjust}
            onDelete={onDelete}
          />
        ),
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
                title={productTooltip(p)}
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
            <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
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
              <ActionMenu
                items={[
                  ...(canEdit
                    ? [
                        {
                          label: "Redaktə et",
                          icon: <Pencil size={15} />,
                          onClick: () => onEdit(p),
                        } satisfies ActionMenuItem,
                      ]
                    : []),
                  ...(canEdit && onDelete
                    ? [
                        {
                          label: "Sil",
                          icon: <Trash2 size={15} />,
                          onClick: () => onDelete(p),
                          tone: "danger" as const,
                        } satisfies ActionMenuItem,
                      ]
                    : []),
                ]}
                aria-label={`${p.name} əməliyyatları`}
              />
            </div>
          </div>
        );
      }}
    />
  );
}
