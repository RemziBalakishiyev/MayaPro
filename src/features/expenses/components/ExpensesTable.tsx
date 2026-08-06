import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { EmptyValue } from "@/components/ui/EmptyValue";
import { fmtDate } from "@/lib/format";
import { ExpenseAmount } from "./amount-presentation";
import type { Expense, Product } from "@/types";

/** Xərc mənbəyi → badge mətni ("source" sahəsi backend/mock-dan). */
const SOURCE_LABEL: Record<Expense["source"], string> = {
  general: "Ümumi",
  product: "Mala bağlı",
};

interface Props {
  expenses: Expense[];
  isLoading?: boolean;
  /**
   * FE#76 (AC-18): xərc sorğusu şəbəkə xətası ilə uğursuz olduqda boş-siyahı
   * mesajı ƏVƏZİNƏ `InlineError` + "Yenidən" göstərilir (digər siyahı
   * səhifələri — Mallar/Müştərilər/Təchizatçılar — ilə eyni `DataTable`
   * standart naxışı).
   */
  isError?: boolean;
  onRetry?: () => void;
  canWrite?: boolean;
  /** Bağlı mal linki üçün tam mal siyahısı (AC-11/TC-18..20). */
  products: Product[];
  /** Mallar hələ yüklənir — "mal tapılmadı" flash etməsin deyə. */
  productsLoading?: boolean;
  /** Boş nəticə mətni (aktiv filtrə görə dəyişir). */
  emptyState?: { title: string; description?: string };
  /** Sətrə/mobil karta klik — xərc detal draweri açılır. */
  onRowClick?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

function ExpenseRowActions({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit?: (e: Expense) => void;
  onDelete?: (e: Expense) => void;
}) {
  const menuItems: ActionMenuItem[] = [
    ...(onDelete
      ? [
          {
            label: "Sil",
            icon: <Trash2 size={15} />,
            onClick: () => onDelete(expense),
            tone: "danger" as const,
          } satisfies ActionMenuItem,
        ]
      : []),
  ];

  return (
    // Sətir onRowClick ilə detal draweri açır — bu sahədəki düymələr/menyu öz
    // funksiyasını icra etsin, drawer açmasın deyə bubbling dayandırılır.
    <div
      className="flex items-center justify-end gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(expense)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-200"
        >
          <Pencil size={14} />
          Düzəliş et
        </button>
      )}
      <ActionMenu
        items={menuItems}
        aria-label={`${expense.title} əməliyyatları`}
      />
    </div>
  );
}

/**
 * FE#76 (AC-11/TC-18..20) — "Bağlı mal" hər yerdə eyni məntiqlə göstərilir:
 * mal mövcuddursa Mallar səhifəsinə kliklənən keçid, mallar hələ yüklənirsə
 * gözləmə mətni, mal tapılmırsa (silinib) `EmptyValue`, ümumi xərcdə isə
 * sadə mətn. Klik `stopPropagation` ilə sətir/kart `onRowClick`
 * (drawer açılışı) davranışını TETİKLEMİR.
 */
function ProductLink({
  productId,
  products,
  productsLoading,
  className,
}: {
  productId: string | null;
  products: Product[];
  productsLoading?: boolean;
  className?: string;
}) {
  if (!productId) {
    return <span className={className ?? "text-xs text-stone-400"}>Ümumi xərc</span>;
  }
  const product = products.find((p) => p.id === productId);
  if (product) {
    return (
      <Link
        to="/mallar/$id"
        params={{ id: productId }}
        onClick={(e) => e.stopPropagation()}
        title={`${product.name} — mal detalına bax`}
        aria-label={`${product.name} — mal detalına bax`}
        className={
          className ??
          "text-xs font-medium text-emerald-700 underline-offset-2 hover:underline"
        }
      >
        {product.name}
      </Link>
    );
  }
  if (productsLoading) {
    return <span className="text-xs text-stone-400">Yüklənir…</span>;
  }
  return <EmptyValue label="mal tapılmadı" />;
}

export function ExpensesTable({
  expenses,
  isLoading,
  isError,
  onRetry,
  canWrite = false,
  products,
  productsLoading,
  emptyState,
  onRowClick,
  onEdit,
  onDelete,
}: Props) {
  const columns = useMemo<ColumnDef<Expense, unknown>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Tarix",
        cell: ({ getValue }) => fmtDate(getValue() as string),
      },
      {
        accessorKey: "title",
        header: "Xərc",
        cell: ({ getValue }) => (
          <span className="font-semibold text-stone-900">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Növ",
        cell: ({ getValue }) => {
          const name = (getValue() as string)?.trim();
          return name ? (
            <Badge>{name}</Badge>
          ) : (
            <span className="text-xs text-stone-400">—</span>
          );
        },
      },
      {
        accessorKey: "source",
        header: "Mənbə",
        cell: ({ getValue }) => (
          <Badge>{SOURCE_LABEL[getValue() as Expense["source"]] ?? "Ümumi"}</Badge>
        ),
      },
      {
        id: "product",
        header: "Bağlı mal",
        accessorFn: (e) =>
          e.productId
            ? (products.find((p) => p.id === e.productId)?.name ?? e.productId)
            : "Ümumi xərc",
        cell: ({ row }) => (
          <ProductLink
            productId={row.original.productId}
            products={products}
            productsLoading={productsLoading}
          />
        ),
      },
      {
        accessorKey: "amount",
        header: "Məbləğ",
        cell: ({ getValue }) => <ExpenseAmount amount={getValue() as number} />,
      },
      {
        accessorKey: "note",
        header: "Qeyd",
        enableSorting: false,
        // Mənbə sütunu əlavə olunduğu üçün ən az prioritetli sütun dar
        // ekranlarda gizlədilir (mobil kartda onsuz da görünür).
        meta: { className: "hidden xl:table-cell" },
        cell: ({ getValue }) => (
          <span className="text-xs text-stone-400">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      ...(canWrite
        ? [
            {
              id: "actions",
              header: "Əməliyyat",
              enableSorting: false,
              cell: ({ row }: { row: { original: Expense } }) => (
                <ExpenseRowActions
                  expense={row.original}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ),
            } as ColumnDef<Expense, unknown>,
          ]
        : []),
    ],
    [products, productsLoading, canWrite, onEdit, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      data={expenses}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      errorMessage="Xərclər yüklənmədi"
      onRowClick={onRowClick}
      emptyState={
        emptyState ?? {
          title: "Xərc yoxdur",
          description: "«Yeni xərc» düyməsi ilə ilk xərci əlavə edin.",
        }
      }
      mobileCard={(e) => (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-stone-900">
                {e.title}
              </p>
              <p className="text-sm text-stone-400">{fmtDate(e.date)}</p>
            </div>
            <ExpenseAmount amount={e.amount} size="md" className="shrink-0 justify-end" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {e.category?.trim() && <Badge>{e.category.trim()}</Badge>}
            <Badge>{SOURCE_LABEL[e.source] ?? "Ümumi"}</Badge>
            {e.productId && (
              <ProductLink
                productId={e.productId}
                products={products}
                productsLoading={productsLoading}
                className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
              />
            )}
          </div>
          {e.note && (
            <p className="mt-2 text-sm text-stone-500">{e.note}</p>
          )}
          {canWrite && (
            <div
              className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3"
              onClick={(ev) => ev.stopPropagation()}
            >
              {onEdit && (
                <button
                  onClick={() => onEdit(e)}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 text-base font-semibold text-stone-700 active:bg-stone-200"
                >
                  <Pencil size={18} /> Düzəliş et
                </button>
              )}
              <ActionMenu
                items={[
                  ...(onDelete
                    ? [
                        {
                          label: "Sil",
                          icon: <Trash2 size={15} />,
                          onClick: () => onDelete(e),
                          tone: "danger" as const,
                        } satisfies ActionMenuItem,
                      ]
                    : []),
                ]}
                aria-label={`${e.title} əməliyyatları`}
              />
            </div>
          )}
        </div>
      )}
    />
  );
}
