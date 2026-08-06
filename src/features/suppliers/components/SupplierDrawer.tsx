import { useMemo } from "react";
import { ArrowDownLeft, BookOpen, HandCoins, Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { CopyablePhone } from "@/components/ui/CopyablePhone";
import { cn } from "@/lib/cn";
import { fmtMoney, fmtDate } from "@/lib/format";
import { toStoredPhone } from "@/lib/phone";
import { useProducts } from "@/features/products/queries";
import { useSupplierHistory } from "../queries";
import {
  DEBT_HEADLINE_CLASS,
  DEBT_PANEL_CLASS,
  DEBT_TONE_LABEL,
  debtAgeDays,
  debtTone,
} from "./debt-presentation";
import type { Supplier, SupplierHistoryEntry } from "@/types";

interface Props {
  supplier: Supplier | null;
  onClose: () => void;
  onAddDebt: (supplier: Supplier) => void;
  onPay: (supplier: Supplier) => void;
}

function historyLabel(entry: SupplierHistoryEntry): string {
  if (entry.type === "initialDebt") return "İlkin borc";
  return entry.note ? `Ödəniş — ${entry.note}` : "Ödəniş";
}

/**
 * FE#75 — "Təchizatçılar" səhifəsinin detal drawer-i. `CustomerDrawer.tsx`
 * (FE#73) ilə EYNİ standart naxış: tone-lu "Cari borcum" əsas panel ·
 * "Əlaqə" kartı · "Bağlı mallar" kartı · vahid xronoloji "Alışlar (borc
 * əlavələri) / Ödəniş tarixçəsi" kartı. Data/sorğular DƏYİŞMİR — yalnız
 * görünüş.
 */
export function SupplierDrawer({ supplier, onClose, onAddDebt, onPay }: Props) {
  const { data: allProducts = [] } = useProducts();
  const { data: historyAsc = [] } = useSupplierHistory(supplier?.id);

  const supProducts = useMemo(
    () =>
      supplier
        ? allProducts.filter((p) => p.supplierId === supplier.id)
        : [],
    [allProducts, supplier],
  );

  // API xronoloji (köhnədən yeniyə) qaytarır → UI-də ən yenilər yuxarıda.
  // Yenidən sıralamaq yerinə çeviririk: eyni tarixli sətirlərdə (məs. yaradılış
  // günü edilən ödəniş) ilkin borc həmişə ən altda qalsın.
  const history = useMemo(() => [...historyAsc].reverse(), [historyAsc]);

  // FE#75 (rəng qaydası) — "Nisyə Borclar"dakı eyni yanaşma: rəng tək
  // göstərici deyil, 4 dərəcəli ton + mətnli badge (`debt-presentation.ts`,
  // Müştərilər/FE#73 ilə EYNİ qayda).
  const debtToneValue = supplier
    ? debtTone(supplier.remainingDebt, debtAgeDays(supplier))
    : "none";
  const status = DEBT_TONE_LABEL[debtToneValue];

  return (
    <Drawer
      open={!!supplier}
      onClose={onClose}
      title={
        supplier ? (
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="truncate">{supplier.name}</span>
            <Badge tone={status} className="shrink-0 text-xs">
              {status}
            </Badge>
          </span>
        ) : (
          ""
        )
      }
      footer={
        supplier ? (
          <div className="flex gap-2 border-t border-stone-200 bg-white p-4">
            <Button
              className="min-w-0 flex-1"
              icon={<HandCoins size={16} />}
              onClick={() => onPay(supplier)}
            >
              Təchizatçıya ödəniş et
            </Button>
            <Button
              className="min-w-0 flex-1"
              variant="secondary"
              icon={<Plus size={16} />}
              onClick={() => onAddDebt(supplier)}
            >
              Borc əlavə et
            </Button>
          </div>
        ) : undefined
      }
    >
      {(isExpanded) =>
      supplier && (
        <div className="space-y-6">
          {/* Cari borcum — əsas siqnal (rəng 4 dərəcəli tondan gəlir, HƏR
              borclu eyni "qırmızı təhlükə" kimi görünmür). */}
          <div className={cn("rounded-card border p-4", DEBT_PANEL_CLASS[debtToneValue])}>
            <p className="text-sm font-medium text-stone-500">Cari borcum</p>
            <p
              className={cn(
                "mt-1 text-3xl font-bold tabular-nums tracking-tight",
                DEBT_HEADLINE_CLASS[debtToneValue],
              )}
            >
              {fmtMoney(supplier.remainingDebt)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-200/80 pt-3">
              <div>
                <p className="text-xs font-medium text-stone-400">
                  Toplam borc
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-stone-800">
                  {fmtMoney(supplier.totalDebt)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-stone-400">Ödənilən</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-700">
                  {fmtMoney(supplier.paidAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Əlaqə — digər bölmələrlə eyni başlıq/kart üslubu. */}
          <section>
            <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-stone-500">
              Əlaqə
            </h4>
            <div className="flex items-center gap-3 rounded-card border border-stone-200 bg-stone-50 px-3.5 py-3">
              {toStoredPhone(supplier.phone) ? (
                <CopyablePhone
                  phone={supplier.phone}
                  className="text-sm font-semibold text-stone-800 underline-offset-2 hover:text-emerald-700 hover:underline"
                />
              ) : (
                <span className="text-sm text-stone-400">Telefon yoxdur</span>
              )}
            </div>
          </section>

          {/* Genişdə "Bağlı mallar" + "Tarixçə" yan-yana göstərilir. */}
          <div
            className={cn(
              "grid grid-cols-1 items-start gap-6",
              isExpanded && "lg:grid-cols-2",
            )}
          >
          <section>
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Bağlı mallar
              </h4>
              {supProducts.length > 0 && (
                <span className="text-xs tabular-nums text-stone-400">
                  {supProducts.length} mal
                </span>
              )}
            </div>
            {supProducts.length === 0 ? (
              <EmptyState icon={Package} title="Bağlı mal yoxdur" />
            ) : (
              <ul className="divide-y divide-stone-100 overflow-hidden rounded-card border border-stone-200 bg-white">
                {supProducts.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 px-3.5 py-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
                      {p.name}
                    </span>
                    <span className="shrink-0 text-xs text-stone-400">
                      {p.quantity} əd. stokda
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/*
            Alışlar (borc əlavələri) / Ödəniş tarixçəsi — FE#75, Müştərilər
            səhifəsindəki (FE#73, bənd 6) EYNİ qərar: QƏSDƏN AYRI-AYRI
            SİYAHILARA PARÇALANMIR, mövcud VAHİD xronoloji tarixçə saxlanılır.
            Səbəb: bir borc qeydi (ilkin borc / mal alışı) və onu söndürən
            ödəniş(lər) vaxt oxunda bir-birinin davamıdır — ayrı siyahılara
            bölünsə, "bu borc artıq ödənilibmi?" sualına cavab üçün iki
            siyahı arasında əl ilə tarix müqayisə etmək lazım gələrdi. Hər
            qeyd artıq NÖVÜNƏ görə vizual fərqlənir (ikon + fon rəngi: ödəniş
            = yaşıl enmə oxu, ilkin borc/mal alışı = kəhrəba kitab ikonu) —
            DS 9-cu qaydaya (rəng tək göstərici deyil) uyğundur.
          */}
          <section>
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Alışlar / ödəniş tarixçəsi
              </h4>
              {history.length > 0 && (
                <span className="text-xs tabular-nums text-stone-400">
                  {history.length} əməliyyat
                </span>
              )}
            </div>
            {history.length === 0 ? (
              <EmptyState icon={HandCoins} title="Tarixçə yoxdur" />
            ) : (
              <ul className="relative space-y-0 overflow-hidden rounded-card border border-stone-200 bg-white">
                {history.map((h, i) => {
                  const isPay = h.type === "payment";
                  return (
                    <li
                      key={`${h.type}-${h.date}-${h.amount}-${i}`}
                      className={cn(
                        "relative flex items-center gap-3 px-3.5 py-3",
                        i > 0 && "border-t border-stone-100",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          isPay
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600",
                        )}
                      >
                        {isPay ? (
                          <ArrowDownLeft size={15} />
                        ) : (
                          <BookOpen size={15} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="min-w-0 truncate text-sm font-semibold text-stone-800">
                          {historyLabel(h)}
                        </p>
                        <p className="text-xs text-stone-400">
                          {fmtDate(h.date)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-bold tabular-nums",
                          isPay ? "text-emerald-700" : "text-red-600",
                        )}
                      >
                        {isPay ? "−" : "+"}
                        {fmtMoney(h.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          </div>
        </div>
      )
      }
    </Drawer>
  );
}
