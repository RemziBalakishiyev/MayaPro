import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronDown, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { phoneDigits } from "@/lib/phone";
import {
  inPeriod,
  PERIOD_LABELS,
  type Period,
} from "@/features/reports/lib";
import { useCustomers } from "@/features/customers/queries";
import { CustomersTable } from "@/features/customers/components/CustomersTable";
import { CustomerDrawer } from "@/features/customers/components/CustomerDrawer";
import { PaymentModal } from "@/features/customers/components/PaymentModal";
import { NewCustomerModal } from "@/features/customers/components/NewCustomerModal";
import type { Customer } from "@/types";

const optNum = z.preprocess((v) => {
  if (v == null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const searchSchema = z.object({
  q: z.string().optional(),
  /** Satış detalından deep-link — drawer açılır */
  customerId: z.string().optional(),
  /** Hamısı = undefined */
  status: z.enum(["borclu", "odenilib"]).optional(),
  /** Köhnə URL: ?borclu=true → status=borclu */
  borclu: z.boolean().optional(),
  minDebt: optNum,
  maxDebt: optNum,
  activity: z.enum(["today", "week", "month", "all"]).default("all"),
  phone: z.enum(["var", "yox"]).optional(),
  initial: z.boolean().optional(),
});

export const Route = createFileRoute("/_app/borclar")({
  validateSearch: searchSchema,
  component: BorclarPage,
});

const ACTIVITY_PERIODS: Period[] = ["today", "week", "month", "all"];

type DebtStatus = "borclu" | "odenilib";

const parseNum = (raw: string): number | undefined => {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

/** Son alış / son ödənişdən ən yenisi. */
function lastActivityDate(c: Customer): string {
  const a = c.lastPurchaseDate || "";
  const b = c.lastPaymentDate || "";
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function BorclarPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { data: customers = [], isLoading } = useCustomers();

  const [selected, setSelected] = useState<Customer | null>(null);
  const [payFor, setPayFor] = useState<Customer | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  // Satış detalından ?customerId=… ilə gələndə drawer aç
  useEffect(() => {
    if (!search.customerId || customers.length === 0) return;
    const c = customers.find((x) => x.id === search.customerId);
    if (c) setSelected(c);
  }, [search.customerId, customers]);

  const status: DebtStatus | undefined =
    search.status ?? (search.borclu ? "borclu" : undefined);

  const activeFilterCount = [
    !!status,
    search.minDebt != null,
    search.maxDebt != null,
    search.activity !== "all",
    !!search.phone,
    !!search.initial,
  ].filter(Boolean).length;

  const [filtersOpen, setFiltersOpen] = useState(
    () => activeFilterCount > 0,
  );

  const filtered = useMemo(() => {
    const q = (search.q ?? "").trim().toLowerCase();
    const qDigits = phoneDigits(search.q ?? "");

    return customers.filter((c) => {
      if (status === "borclu" && c.remainingDebt <= 0) return false;
      if (status === "odenilib" && c.remainingDebt > 0) return false;

      if (search.minDebt != null && c.remainingDebt < search.minDebt)
        return false;
      if (search.maxDebt != null && c.remainingDebt > search.maxDebt)
        return false;

      if (search.phone === "var" && !phoneDigits(c.phone)) return false;
      if (search.phone === "yox" && phoneDigits(c.phone)) return false;

      if (search.initial && !(c.initialDebt > 0)) return false;

      if (search.activity !== "all") {
        const last = lastActivityDate(c);
        if (!last || !inPeriod(last, search.activity)) return false;
      }

      if (q) {
        const nameOk = c.name.toLowerCase().includes(q);
        const phoneOk =
          (c.phone || "").toLowerCase().includes(q) ||
          (!!qDigits && phoneDigits(c.phone).includes(qDigits));
        if (!nameOk && !phoneOk) return false;
      }

      return true;
    });
  }, [customers, search, status]);

  const filteredDebt = useMemo(
    () => filtered.reduce((s, c) => s + c.remainingDebt, 0),
    [filtered],
  );

  const totalDebt = useMemo(
    () => customers.reduce((s, c) => s + c.remainingDebt, 0),
    [customers],
  );

  const hasFilters = activeFilterCount > 0 || !!(search.q ?? "").trim();

  const clearFilters = () => {
    navigate({
      search: {
        q: search.q || undefined,
        customerId: search.customerId,
        status: undefined,
        borclu: undefined,
        minDebt: undefined,
        maxDebt: undefined,
        activity: "all",
        phone: undefined,
        initial: undefined,
      },
    });
  };

  const setStatus = (next: DebtStatus | undefined) => {
    navigate({
      search: (prev) => ({
        ...prev,
        status: next,
        borclu: undefined,
      }),
    });
  };

  // Seçilmiş müştərini cədvəldəki güncəl datadan götür (ödənişdən sonra yenilənsin)
  const liveSelected = selected
    ? (customers.find((c) => c.id === selected.id) ?? null)
    : null;
  const livePayFor = payFor
    ? (customers.find((c) => c.id === payFor.id) ?? null)
    : null;

  const subtitle =
    hasFilters && filtered.length !== customers.length
      ? `${filtered.length} / ${customers.length} müştəri · Qalıq: ${fmtMoney(filteredDebt)} (ümumi ${fmtMoney(totalDebt)})`
      : `${customers.length} müştəri · Ümumi qalıq borc: ${fmtMoney(totalDebt)}`;

  return (
    <div>
      <PageHead
        title="Nisyə Borclar"
        subtitle={subtitle}
        actions={
          <Button size="md" icon={<Plus size={18} />} onClick={() => setNewOpen(true)}>
            Yeni müştəri
          </Button>
        }
      />

      <div className="mb-4 space-y-3">
        <div className="relative max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={search.q ?? ""}
            onChange={(e) =>
              navigate({
                search: (prev) => ({ ...prev, q: e.target.value || undefined }),
              })
            }
            placeholder="Ad və ya telefon üzrə axtar..."
            className={`${inputCls} pl-8`}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50/60">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700">
              <SlidersHorizontal size={16} className="text-stone-500" />
              Filterlər
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <ChevronDown
              size={18}
              className={cn(
                "shrink-0 text-stone-400 transition-transform",
                filtersOpen && "rotate-180",
              )}
            />
          </button>

          {filtersOpen && (
            <div className="space-y-3 border-t border-stone-200 px-3 py-3">
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-stone-400">
                  Status
                </p>
                <div
                  role="tablist"
                  aria-label="Status"
                  className="flex w-full min-w-0 flex-nowrap gap-0.5 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1"
                >
                  {(
                    [
                      { key: undefined, label: "Hamısı" },
                      { key: "borclu" as const, label: "Borclu" },
                      { key: "odenilib" as const, label: "Ödənilib" },
                    ] as const
                  ).map(({ key, label }) => {
                    const active = status === key;
                    return (
                      <button
                        key={label}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setStatus(key)}
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-emerald-700 text-white shadow-sm"
                            : "text-stone-500 hover:bg-stone-50 hover:text-stone-800",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-stone-400">
                  Son əməliyyat
                </p>
                <div
                  role="tablist"
                  aria-label="Son əməliyyat dövrü"
                  className="flex w-full min-w-0 flex-nowrap gap-0.5 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1"
                >
                  {ACTIVITY_PERIODS.map((p) => {
                    const active = search.activity === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() =>
                          navigate({
                            search: (prev) => ({ ...prev, activity: p }),
                          })
                        }
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-emerald-700 text-white shadow-sm"
                            : "text-stone-500 hover:bg-stone-50 hover:text-stone-800",
                        )}
                      >
                        {PERIOD_LABELS[p]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">
                    Min qalıq
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={search.minDebt ?? ""}
                    onChange={(e) =>
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          minDebt: parseNum(e.target.value),
                        }),
                      })
                    }
                    placeholder="0"
                    className={cn(inputCls, "h-9 px-3 text-sm")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">
                    Max qalıq
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={search.maxDebt ?? ""}
                    onChange={(e) =>
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          maxDebt: parseNum(e.target.value),
                        }),
                      })
                    }
                    placeholder="∞"
                    className={cn(inputCls, "h-9 px-3 text-sm")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">
                    Telefon
                  </label>
                  <div className="flex gap-0.5 rounded-xl border border-stone-200 bg-white p-1">
                    {(
                      [
                        { key: undefined, label: "Hamısı" },
                        { key: "var" as const, label: "Var" },
                        { key: "yox" as const, label: "Yox" },
                      ] as const
                    ).map(({ key, label }) => {
                      const active = search.phone === key;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            navigate({
                              search: (prev) => ({
                                ...prev,
                                phone: key,
                              }),
                            })
                          }
                          className={cn(
                            "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                            active
                              ? "bg-emerald-700 text-white shadow-sm"
                              : "text-stone-500 hover:bg-stone-50",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-600">
                    <input
                      type="checkbox"
                      checked={!!search.initial}
                      onChange={(e) =>
                        navigate({
                          search: (prev) => ({
                            ...prev,
                            initial: e.target.checked || undefined,
                          }),
                        })
                      }
                      className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    İlkin borclu
                  </label>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  >
                    <X size={14} />
                    Filterləri təmizlə
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CustomersTable
        customers={filtered}
        isLoading={isLoading}
        onView={setSelected}
        onPay={setPayFor}
        emptyState={
          hasFilters
            ? {
                title: "Filterə uyğun müştəri yoxdur",
                description: "Axtarışı və ya filterləri dəyişin.",
              }
            : undefined
        }
      />

      <CustomerDrawer
        customer={liveSelected}
        onClose={() => {
          setSelected(null);
          if (search.customerId) {
            navigate({
              search: (prev) => ({ ...prev, customerId: undefined }),
            });
          }
        }}
        onPay={setPayFor}
      />
      <PaymentModal
        open={!!payFor}
        onClose={() => setPayFor(null)}
        customer={livePayFor}
      />
      <NewCustomerModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
