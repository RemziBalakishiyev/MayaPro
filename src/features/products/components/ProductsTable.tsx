import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Package,
  Plus,
  Minus,
  Pencil,
  Eye,
  Trash2,
  Barcode,
  HelpCircle,
} from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyValue } from "@/components/ui/EmptyValue";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { profitPercent, firstAttrValue, hasNoBatchExpense } from "../lib";
import { ProductStatusBadge } from "./ProductStatusBadge";
import type { Product } from "@/types";

export type StockMode = "add" | "sub";

// FE#70 (AC-9) — PM nümunə mətni ilə hərfi eyni (əvvəlki "...alış qiymətinə
// bərabərdir" versiyasından yalnız söz seçimi cəhətdən dəqiqləşdirilib;
// DAVRANIŞ dəyişməyib — hasNoBatchExpense() eyni şərtdir).
const NO_EXPENSE_HINT = "Xərc yoxdur — maya alışa bərabərdir";

// FE#70 (AC-8) — "Qazanc %" başlığının kömək tooltip-i (düstur DƏYİŞMƏYİB,
// yalnız izah əlavə olunub). Mətn PM AC-8-də təyin etdiyi hərfi mətndir.
const PROFIT_HELP =
  "Satış qiyməti ilə real maya arasındakı fərqin mayaya nisbəti";

// FE#70 (AC-9) — "Alış" və "Real maya" fərqinin başlıq tooltip izahları.
const PURCHASE_HELP =
  "Təchizatçıya ödənən alış qiyməti. Partiya xərci yoxdursa, real maya ilə eynidir (aşağıda «—»).";
const REAL_COST_HELP =
  "1 ədədin faktiki dəyəri: alış qiyməti + bu partiyaya aid əlavə xərclər (nəqliyyat, gömrük və s.).";

/**
 * Mal xanasının tooltip-i: kəsilmiş ad + anbar yeri
 * (yer sütunu cədvəldən çıxarıldığı üçün burada göstərilir).
 */
const productTooltip = (p: Product): string =>
  [p.name, p.location].filter(Boolean).join("\n");

/**
 * Sütun başlığı: mətn + kömək ikonu, hover-də `title` tooltip-i.
 *
 * `tabIndex` qəsdən verilmir — bu span `DataTable`-ın sıralana bilən
 * sütunlarında artıq fokuslana bilən `<button>` daxilində render olunur;
 * içəri əlavə fokuslanan element "nested interactive" HTML problemi
 * yaradardı. Klaviatura/ekran oxuyucusu istifadəçiləri izahı görünməz
 * `sr-only` mətndən alır (aşağıda) — fokusa bağlı deyil.
 */
function HeaderHelp({ text, help }: { text: string; help: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={help}>
      <span>{text}</span>
      <HelpCircle size={13} className="shrink-0 text-stone-400" aria-hidden />
      <span className="sr-only"> — {help}</span>
    </span>
  );
}

interface Props {
  products: Product[];
  isLoading?: boolean;
  /**
   * FE#87 (TC-32.1/32.2): mal sorğusu şəbəkə xətası ilə uğursuz olduqda
   * boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən" göstərilir.
   */
  isError?: boolean;
  onRetry?: () => void;
  /** Redaktə (mal yeniləmə) icazəsi — satıcıda gizli. Stok düzəlişi hamıda qalır. */
  canEdit?: boolean;
  onEdit: (product: Product) => void;
  onAdjust: (product: Product, mode: StockMode) => void;
  onDelete?: (product: Product) => void;
  /** Tez etiket çapı: bu malı 1×N seçilmiş halda etiket çapı modalını açır. */
  onPrintLabel?: (product: Product) => void;
  /**
   * FE#70 (AC-19/TC-28) — axtarış/filtr nəticəsiz qaldıqda çağıran tərəf
   * fərqli (daha dəqiq) boş-nəticə mesajı ötürə bilər. Verilməzsə defolt
   * "Mal tapılmadı" mesajı göstərilir.
   */
  emptyState?: { title: string; description?: string };
}

function ProductRowActions({
  product,
  canEdit,
  onEdit,
  onAdjust,
  onDelete,
  onPrintLabel,
}: {
  product: Product;
  canEdit: boolean;
  onEdit: (p: Product) => void;
  onAdjust: (p: Product, mode: StockMode) => void;
  onDelete?: (p: Product) => void;
  onPrintLabel?: (p: Product) => void;
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
      {/* FE#70 (AC-13) — sətrin əsas əməliyyatı: mətnli düymə ("Stok artır"),
          yalnız-ikon deyil. Davranış (mode="add") dəyişməyib. */}
      <button
        type="button"
        onClick={() => onAdjust(product, "add")}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        <Plus size={14} />
        Stok artır
      </button>
      {onPrintLabel && (
        <button
          type="button"
          onClick={() => onPrintLabel(product)}
          aria-label={`${product.name} — barkod/QR etiket çap et`}
          title="Etiket çap et"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-800"
        >
          <Barcode size={15} />
        </button>
      )}
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
  isError,
  onRetry,
  canEdit = true,
  onEdit,
  onAdjust,
  onDelete,
  onPrintLabel,
  emptyState,
}: Props) {
  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Mal",
        cell: ({ row }) => {
          const p = row.original;
          return (
            // FE#70 (AC-16) — mal adı xanasının bütövü (ikon + ad + alt mətn)
            // klikləniəndir və REDAKTƏ FORMUNU açır. Əvvəlki `/mallar/$id`
            // detal SƏHİFƏSİNƏ keçid buradan silinib (bənd 12/16) — həmin
            // səhifə özü qalır, "Digər" menyusundaki "Detal" bəndindən əl
            // ilə açıla bilər.
            <button
              type="button"
              onClick={() => onEdit(p)}
              className="focus-ring-inset flex w-full items-center gap-2.5 rounded-control text-left hover:opacity-80"
              title={productTooltip(p)}
              aria-label={`${p.name} — redaktə et`}
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
            </button>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Kateqoriya",
        // FE#70 (AC-11) — Kateqoriya prioritet sütunudur, 1280px+ (xl) daxil
        // hər zaman görünür (əvvəlki "hidden 2xl:table-cell" qaldırılıb).
        cell: ({ getValue }) => {
          const v = (getValue() as string) || "";
          return v ? (
            v
          ) : (
            <EmptyValue label="Kateqoriya təyin edilməyib" title="Kateqoriya təyin edilməyib" />
          );
        },
      },
      {
        accessorKey: "purchasePrice",
        header: () => <HeaderHelp text="Alış" help={PURCHASE_HELP} />,
        // FE#70 (AC-11) — audit qərarı: "Alış" ikinci dərəcəli sütundur,
        // yalnız lg+ (≥1024px) ekranlarda görünür — 1280/1366/1440/1920
        // (bütün B1 test enləri lg-dən böyükdür) bu sütunu göstərməyə davam
        // edir, daha kiçik ekranda (planşet/mobil card) yer azaldılır.
        // Qərar sənədləşdirilib: docs/pages/inventory-ui-refactor.md.
        meta: { className: "hidden lg:table-cell" },
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
        header: () => <HeaderHelp text="Real maya" help={REAL_COST_HELP} />,
        cell: ({ getValue }) => (
          <span className="font-bold tabular-nums text-stone-900">
            {fmtMoney(getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: "salePrice",
        header: "Satış qiyməti",
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
        // FE#70 (AC-8) — başlıq "Maya üzərindən qazanc %"-a dəqiqləşdirilib +
        // kömək tooltip-i əlavə olunub. Düstur (`profitPercent`) DƏYİŞMƏYİB.
        header: () => (
          <HeaderHelp text="Maya üzərindən qazanc %" help={PROFIT_HELP} />
        ),
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
            onPrintLabel={onPrintLabel}
          />
        ),
      },
    ],
    [onEdit, onAdjust, onDelete, onPrintLabel, canEdit],
  );

  return (
    <DataTable
      columns={columns}
      data={products}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      errorMessage="Mallar yüklənmədi"
      emptyState={
        emptyState ?? {
          title: "Mal tapılmadı",
          description: "Filterləri dəyişin və ya yeni mal əlavə edin.",
        }
      }
      // FE#70 (AC-17) — uzun siyahılarda başlıq sətri sabit qalır.
      stickyHeader
      mobileCard={(p) => {
        const loss = p.salePrice < p.realCostPerUnit;
        return (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              {/* FE#70 (AC-16) — mobil kartda da ad sahəsi redaktə formunu açır. */}
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="focus-ring-inset min-w-0 text-left"
                title={productTooltip(p)}
                aria-label={`${p.name} — redaktə et`}
              >
                <p className="truncate text-lg font-bold text-stone-900">
                  {p.name}
                </p>
                {firstAttrValue(p) && (
                  <p className="truncate text-sm text-stone-400">
                    {firstAttrValue(p)}
                  </p>
                )}
              </button>
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
                <Plus size={18} /> Stok artır
              </button>
              <button
                onClick={() => onAdjust(p, "sub")}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-50 text-base font-semibold text-amber-700 active:bg-amber-100"
              >
                <Minus size={18} /> Stok azalt
              </button>
              <ActionMenu
                items={[
                  ...(onPrintLabel
                    ? [
                        {
                          label: "Etiket çap et",
                          icon: <Barcode size={15} />,
                          onClick: () => onPrintLabel(p),
                        } satisfies ActionMenuItem,
                      ]
                    : []),
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
