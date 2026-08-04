import { useMemo } from "react";
import { fmtMoney } from "@/lib/format";
import { phoneDigits } from "@/lib/phone";
import { useOpenDebts } from "../queries";
import { OpenDebtsTable } from "./OpenDebtsTable";
import type { Customer } from "@/types";

interface Props {
  /** Axtarış — idarəsi `BorclarPage`-in paylaşılan axtarış zolağındadır (FE#63). */
  q: string;
  customers: Customer[];
  onPay: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  /** Xarici kart içində göstərilir — öz border/shadow-u yoxdur (FE#63). */
  embedded?: boolean;
}

/**
 * FE#40 — "Borclar" görünüşü: BE#21 `GET /api/customers/open-debts` üzərində
 * axtarışlı cədvəl.
 *
 * FE#63 — əvvəllər cədvəl üstündə "Ümumi qalıq borc" adlı nəhəng StatCard
 * göstərilirdi ki, bu, KPI panelindəki "Ümumi qalıq"dan (müştəri-üzrə cəm)
 * FƏRQLİ bir hesablamaya (mənbə-üzrə cəm) əsaslanır və istifadəçini
 * çaşdırırdı (3,529 vs 5,475). Ümumi rəqəmlər İNDİ YALNIZ KPI panelində
 * yaşayır — bu görünüş cədvəlin ALTINDA sadəcə GÖRÜNƏN (axtarışdan sonrakı)
 * sətirlərin kiçik cəm sətrini göstərir, fərqin səbəbi ("axtarışa görə
 * dəyişir") aydın olsun deyə.
 */
export function OpenDebtsView({ q, customers, onPay, onView, embedded }: Props) {
  const { data, isLoading, isError, refetch } = useOpenDebts();
  const items = data?.items ?? [];

  const customersById = useMemo(() => {
    const m = new Map<string, Customer>();
    customers.forEach((c) => m.set(c.id, c));
    return m;
  }, [customers]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    const digits = phoneDigits(q);
    return items.filter((d) => {
      const nameOk = d.customerName.toLowerCase().includes(term);
      const phoneOk =
        (d.phone || "").toLowerCase().includes(term) ||
        (!!digits && phoneDigits(d.phone || "").includes(digits));
      const descOk = d.description.toLowerCase().includes(term);
      return nameOk || phoneOk || descOk;
    });
  }, [items, q]);

  const hasFilter = !!q.trim();
  const visibleTotal = useMemo(
    () => filtered.reduce((sum, d) => sum + d.remaining, 0),
    [filtered],
  );

  return (
    <div className="space-y-2">
      <OpenDebtsTable
        debts={filtered}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        embedded={embedded}
        customersById={customersById}
        onPay={onPay}
        onView={onView}
        emptyState={
          hasFilter
            ? {
                title: "Axtarışa uyğun borc yoxdur",
                description: "Axtarışı dəyişin.",
              }
            : undefined
        }
      />

      {!isLoading && filtered.length > 0 && (
        <p
          data-testid="open-debts-summary"
          className="flex items-center justify-end gap-1.5 px-1 text-xs text-stone-500"
        >
          <span>Görünən:</span>
          <span className="font-semibold tabular-nums text-stone-700">
            {filtered.length} borc
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold tabular-nums text-stone-700">
            {fmtMoney(visibleTotal)}
          </span>
          {hasFilter && (
            <span className="text-stone-400">(axtarışa uyğun)</span>
          )}
        </p>
      )}
    </div>
  );
}
