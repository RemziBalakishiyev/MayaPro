import { useMemo } from "react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyValue } from "@/components/ui/EmptyValue";
import { cn } from "@/lib/cn";
import { fmtDate, fmtMoney, fmtMoneySigned } from "@/lib/format";
import { useAuthStore } from "@/features/auth/store";
import { useEmployees } from "@/features/employees/queries";
import { useProducts } from "@/features/products/queries";
import { expenseCostImpactPerUnit } from "../lib";
import type { Expense } from "@/types";

/** Mənbə → badge mətni (cədvəllə eyni sözlər). */
const SOURCE_LABEL: Record<Expense["source"], string> = {
  general: "Ümumi",
  product: "Mala bağlı",
};

interface Props {
  /** Açıq xərc — null olanda drawer bağlıdır. */
  expense: Expense | null;
  onClose: () => void;
  /** "Düzəliş et" — forma drawerini açır (bu drawer özü bağlanır). */
  onEdit: (expense: Expense) => void;
  /** "Sil" — silmə təsdiqini açır. */
  onDelete: (expense: Expense) => void;
  /** `expenses.write` icazəsi — yoxdursa footer düymələri render olunmur. */
  canWrite?: boolean;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-400">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-sm text-stone-500">{label}</span>
      <span
        className={cn(
          "min-w-0 text-right tabular-nums text-stone-800",
          strong ? "text-lg font-bold text-stone-900" : "text-sm font-medium",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Xərc sətrindən açılan detal drawer — satış detalı ilə eyni kart üslubunda. */
export function ExpenseDetailDrawer({
  expense,
  onClose,
  onEdit,
  onDelete,
  canWrite = false,
}: Props) {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: employees = [] } = useEmployees();
  const user = useAuthStore((s) => s.user);

  // "Kim yazıb" — ActivityLog naxışı: işçi siyahısı → cari istifadəçi → Naməlum.
  const nameOf = useMemo(() => {
    const map = new Map(employees.map((e) => [e.id, e.name]));
    return (id: string | null | undefined) => {
      if (!id) return "Naməlum";
      return map.get(id) ?? (user && user.id === id ? user.name : "Naməlum");
    };
  }, [employees, user]);

  const productId = expense?.source === "product" ? expense.productId : null;
  const product = productId
    ? (products.find((p) => p.id === productId) ?? null)
    : null;
  // Mal silinibsə/tapılmırsa və ya ilkin say 0-dırsa maya təsiri hesablanmır.
  const costImpact = expense
    ? expenseCostImpactPerUnit(expense.amount, product)
    : null;

  // 375px-də 2 sütun × ~163px: yan boşluq/şrift kiçildilir (satış detalı ilə eyni).
  const footerBtnCls = "w-full min-w-0 px-3 text-sm";

  const footer =
    expense && canWrite ? (
      <div className="grid grid-cols-2 gap-2 border-t border-stone-200 bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className={footerBtnCls}
          icon={<Pencil size={18} className="shrink-0" />}
          onClick={() => {
            onClose();
            onEdit(expense);
          }}
        >
          <span className="truncate">Düzəliş et</span>
        </Button>
        <Button
          type="button"
          variant="danger"
          size="lg"
          className={footerBtnCls}
          icon={<Trash2 size={18} className="shrink-0" />}
          onClick={() => onDelete(expense)}
        >
          <span className="truncate">Sil</span>
        </Button>
      </div>
    ) : undefined;

  return (
    <Drawer
      open={!!expense}
      onClose={onClose}
      title="Xərc detalı"
      footer={footer}
    >
      {expense && (
        <div className="space-y-4">
          {/* Başlıq zolağı: ad + nəhəng məbləğ + mənbə badge */}
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-stone-900">
                {expense.title}
              </p>
              {expense.category?.trim() && (
                <p className="mt-1 truncate text-sm text-stone-400">
                  {expense.category.trim()}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-extrabold tabular-nums text-red-600">
                {/* Ekran oxuyucusu üçün: rəqəm tək başına mənasızdır. */}
                <span className="sr-only">Xərc məbləği: </span>
                {fmtMoney(expense.amount)}
              </p>
              <Badge className="mt-1">
                {SOURCE_LABEL[expense.source] ?? "Ümumi"}
              </Badge>
            </div>
          </div>

          <Card title="Məlumat">
            <Row
              label="Növ"
              value={expense.category?.trim() || <EmptyValue />}
            />
            <Row label="Tarix" value={fmtDate(expense.date)} />

            {/* Mala bağlı xərc: mal detalına keçid + mayaya təsir izahı */}
            {productId && (
              <>
                <Row
                  label="Bağlı mal"
                  value={
                    product ? (
                      <Link
                        to="/mallar/$id"
                        params={{ id: productId }}
                        onClick={onClose}
                        className="font-bold text-emerald-700 underline-offset-2 hover:underline"
                      >
                        {product.name}
                      </Link>
                    ) : productsLoading ? (
                      // Mallar siyahısı hələ yüklənir — "mal tapılmadı" flash
                      // etməsin deyə ayrıca gözləmə göstəricisi.
                      <span className="text-sm text-stone-400">Yüklənir…</span>
                    ) : (
                      <EmptyValue label="mal tapılmadı" />
                    )
                  }
                />
                {costImpact != null && (
                  <Row
                    label="Mayaya təsiri"
                    value={
                      <span className="font-semibold text-stone-700">
                        {fmtMoneySigned(costImpact)}/ədəd
                      </span>
                    }
                  />
                )}
              </>
            )}

            <Row label="Qeyd" value={expense.note?.trim() || <EmptyValue />} />
            <Row label="Kim yazıb" value={nameOf(expense.createdByUserId)} />
          </Card>
        </div>
      )}
    </Drawer>
  );
}
