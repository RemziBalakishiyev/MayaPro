import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FilterBar } from "@/components/ui/FilterBar";
import { inputCls } from "@/components/ui/Input";
import { LocalTableSearch } from "@/components/ui/LocalTableSearch";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import type { PeriodRange } from "@/components/ui/period-filter-lib";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { phoneDigits } from "@/lib/phone";
import {
  inPeriod,
  PERIOD_LABELS,
  type BasePeriod,
} from "@/features/reports/lib";
import { useCan } from "@/features/auth/store";
import {
  useCustomers,
  useDeleteCustomer,
} from "@/features/customers/queries";
import { CustomersTable } from "@/features/customers/components/CustomersTable";
import { CustomerDrawer } from "@/features/customers/components/CustomerDrawer";
import {
  DebtsKpiCards,
  DebtsPeriodLine,
} from "@/features/customers/components/DebtsKpiCards";
import { PaymentModal } from "@/features/customers/components/PaymentModal";
import { NewCustomerModal } from "@/features/customers/components/NewCustomerModal";
import { EditCustomerModal } from "@/features/customers/components/EditCustomerModal";
import { OpenDebtsView } from "@/features/customers/components/OpenDebtsView";
import {
  DebtViewToggle,
  type DebtViewMode,
} from "@/features/customers/components/DebtViewToggle";
import type { Customer } from "@/types";

const optNum = z.preprocess((v) => {
  if (v == null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const searchSchema = z.object({
  q: z.string().optional(),
  /**
   * FE#40 — görünüş rejimi: "borclar" (default) mənbə-mənbə açıq borclar
   * (BE#21), "musteri" isə köhnə müştəri-üzrə cədvəl. URL-də saxlanır ki,
   * səhifə yenilənəndə seçim itməsin.
   */
  mode: z.enum(["borclar", "musteri"]).default("borclar"),
  /** Satış detalından deep-link — drawer açılır */
  customerId: z.string().optional(),
  /**
   * Default "borclu" — Nisyə Borclar səhifəsi borclu müştərilərə fokuslanır.
   * URL-də ?status=all yazıla bilər ki, filtri "Hamısı"na keçirsin.
   */
  status: z.enum(["borclu", "odenilib", "all"]).default("borclu"),
  /** Köhnə URL: ?borclu=true → status=borclu */
  borclu: z.boolean().optional(),
  minDebt: optNum,
  maxDebt: optNum,
  activity: z.enum(["today", "week", "month", "all"]).default("all"),
  phone: z.enum(["var", "yox"]).optional(),
  initial: z.boolean().optional(),
  /** FE#56 — paylaşılan PeriodFilter (KPI sırasının periodNewDebt/periodCollected sahələri). */
  from: z.string().optional(),
  to: z.string().optional(),
});

export const Route = createFileRoute("/_app/borclar")({
  validateSearch: searchSchema,
  component: BorclarPage,
});

const ACTIVITY_PERIODS: BasePeriod[] = ["today", "week", "month", "all"];

type DebtStatus = "borclu" | "odenilib" | "all";

const STATUS_LABELS: Record<DebtStatus, string> = {
  borclu: "Borclu",
  odenilib: "Ödənilib",
  all: "Hamısı",
};

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
  const toast = useToast();
  const { data: customers = [], isLoading } = useCustomers();
  const canEdit = useCan()("customers.write");
  const canDelete = useCan()("customers.delete");
  const deleteMut = useDeleteCustomer();

  const [selected, setSelected] = useState<Customer | null>(null);
  const [payFor, setPayFor] = useState<Customer | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [editFor, setEditFor] = useState<Customer | null>(null);
  const [deleteFor, setDeleteFor] = useState<Customer | null>(null);

  // Satış detalından ?customerId=… ilə gələndə drawer aç
  useEffect(() => {
    if (!search.customerId || customers.length === 0) return;
    const c = customers.find((x) => x.id === search.customerId);
    if (c) setSelected(c);
  }, [search.customerId, customers]);

  const range: PeriodRange = { from: search.from, to: search.to };
  const updateRange = (patch: PeriodRange) =>
    navigate({
      search: (prev) => ({ ...prev, from: patch.from, to: patch.to }),
    });

  const mode: DebtViewMode = search.mode ?? "borclar";
  const setMode = (next: DebtViewMode) => {
    navigate({ search: (prev) => ({ ...prev, mode: next }) });
  };

  // "borclu" default — Nisyə Borclar səhifəsi borclulara fokuslanır.
  // Köhnə URL ?borclu=true şəklindən də dəstək; default olmadığı halda aktiv filtir sayılır.
  const status: DebtStatus =
    search.status ?? (search.borclu ? "borclu" : "borclu");

  const activeFilterCount = [
    status !== "borclu",
    search.minDebt != null,
    search.maxDebt != null,
    search.activity !== "all",
    !!search.phone,
    !!search.initial,
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    const q = (search.q ?? "").trim().toLowerCase();
    const qDigits = phoneDigits(search.q ?? "");

    return customers.filter((c) => {
      if (status === "borclu" && c.remainingDebt <= 0) return false;
      if (status === "odenilib" && c.remainingDebt > 0) return false;
      // status === "all" → borc statusu üzrə filtir yoxdur

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

  const hasFilters = activeFilterCount > 0 || !!(search.q ?? "").trim();

  const clearFilters = () => {
    navigate({
      search: {
        q: search.q || undefined,
        customerId: search.customerId,
        mode: search.mode,
        status: "borclu",
        borclu: undefined,
        minDebt: undefined,
        maxDebt: undefined,
        activity: "all",
        phone: undefined,
        initial: undefined,
      },
    });
  };

  const setStatus = (next: DebtStatus) => {
    navigate({
      search: (prev) => ({
        ...prev,
        status: next,
        borclu: undefined,
      }),
    });
  };

  const setQ = (val: string) =>
    navigate({
      search: (prev) => ({ ...prev, q: val || undefined }),
    });

  /**
   * FE#63 — KPI panelindəki "Ən çox borclu" mini-kartına klik ediləndə
   * cədvəli həmin müştəriyə filtrləyir (funksional keçid). KPI endpoint-i
   * `customerId` qaytarmadığı üçün ad üzrə axtarış istifadə olunur — bu,
   * hər iki görünüş rejimində (Borclar/Müştəri üzrə) artıq mövcud olan
   * axtarış davranışı ilə eynidir.
   */
  const selectDebtor = (name: string) => setQ(name);

  // Seçilmiş müştərini cədvəldəki güncəl datadan götür (ödənişdən sonra yenilənsin)
  const liveSelected = selected
    ? (customers.find((c) => c.id === selected.id) ?? null)
    : null;
  const livePayFor = payFor
    ? (customers.find((c) => c.id === payFor.id) ?? null)
    : null;

  const handleDelete = async () => {
    if (!deleteFor) return;
    try {
      await deleteMut.mutateAsync(deleteFor.id);
      toast.success("Müştəri silindi");
      if (selected?.id === deleteFor.id) setSelected(null);
      setDeleteFor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Müştəri silinmədi");
    }
  };

  // FE#63 — aktiv filtrlər FilterBar çipləri üçün (musteri rejimi).
  const activeFilters = [
    status !== "borclu" && { id: "status", label: STATUS_LABELS[status] },
    search.minDebt != null && {
      id: "minDebt",
      label: `Min: ${fmtMoney(search.minDebt)}`,
    },
    search.maxDebt != null && {
      id: "maxDebt",
      label: `Max: ${fmtMoney(search.maxDebt)}`,
    },
    search.activity !== "all" && {
      id: "activity",
      label: PERIOD_LABELS[search.activity],
    },
    search.phone && {
      id: "phone",
      label: search.phone === "var" ? "Telefon: var" : "Telefon: yox",
    },
    search.initial && { id: "initial", label: "İlkin borclu" },
  ].filter(Boolean) as Array<{ id: string; label: string }>;

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === "status") setStatus("borclu");
    else if (filterId === "minDebt")
      navigate({ search: (prev) => ({ ...prev, minDebt: undefined }) });
    else if (filterId === "maxDebt")
      navigate({ search: (prev) => ({ ...prev, maxDebt: undefined }) });
    else if (filterId === "activity")
      navigate({ search: (prev) => ({ ...prev, activity: "all" }) });
    else if (filterId === "phone")
      navigate({ search: (prev) => ({ ...prev, phone: undefined }) });
    else if (filterId === "initial")
      navigate({ search: (prev) => ({ ...prev, initial: undefined }) });
  };

  return (
    <div>
      <PageHeader
        title="Nisyə Borclar"
        subtitle="Borcu olan müştərilər və ödənişlər"
        primaryAction={
          <Button size="md" icon={<Plus size={18} />} onClick={() => setNewOpen(true)}>
            Yeni müştəri
          </Button>
        }
      />

      {/* FE#63 — dövr bloku: PeriodFilter çipləri + bilavasitə altında "Bu
          dövrdə…" sətri eyni konteynerdə ("Dövr:" etiketi bu əlaqəni
          göstərir). Aşağıdakı BORC VƏZİYYƏTİ/ƏN ÇOX BORCLU panelləri isə
          ANLIQ (dövrdən asılı olmayan) sahələr olduğu üçün BU konteynerdən
          kənardadır. */}
      <div className="mb-4 rounded-2xl border border-stone-200 bg-stone-50/60 p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Dövr:
          </span>
          <PeriodFilter
            value={range}
            onChange={updateRange}
            defaultKey="all"
            className="min-w-0 flex-1"
          />
        </div>
        <DebtsPeriodLine range={range} />
      </div>

      <DebtsKpiCards range={range} onSelectDebtor={selectDebtor} />

      {/* FE#63 — Görünüş toqqlları + axtarış/filterlər tək kart daxilində,
          cədvəldən dərhal əvvəl (FilterBar dili). */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
        <div className="space-y-3 border-b border-stone-100 px-4 py-3 sm:px-5">
          <DebtViewToggle value={mode} onChange={setMode} />

          {mode === "borclar" ? (
            /* FE#69 — paylaşılan `LocalTableSearch` (AC-14): qlobal axtarışdan
               fərqli placeholder və görünüş; davranış dəyişməyib. */
            <LocalTableSearch
              value={search.q ?? ""}
              onChange={setQ}
              placeholder="Bu siyahıda axtar... (ad, telefon və ya mal)"
              ariaLabel="Borc siyahısında axtar"
            />
          ) : (
            <FilterBar
              searchValue={search.q ?? ""}
              onSearchChange={setQ}
              searchAriaLabel="Müştəri axtar"
              searchPlaceholder="Ad və ya telefon üzrə axtar..."
              activeCount={activeFilterCount}
              activeFilters={activeFilters}
              onRemoveFilter={handleRemoveFilter}
              onClear={clearFilters}
              clearLabel="Filterləri təmizlə"
              label="Filterlər"
            >
              <div className="space-y-3">
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
                        { key: "borclu" as const, label: "Borclu" },
                        { key: "odenilib" as const, label: "Ödənilib" },
                        { key: "all" as const, label: "Hamısı" },
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
              </div>
            </FilterBar>
          )}
        </div>

        <div className="p-3 pb-4 sm:px-4 sm:pb-4">
          {mode === "borclar" && (
            <OpenDebtsView
              q={search.q ?? ""}
              customers={customers}
              onPay={setPayFor}
              onView={setSelected}
              embedded
            />
          )}

          {mode === "musteri" && (
            <div className="space-y-2">
              <CustomersTable
                customers={filtered}
                isLoading={isLoading}
                canEdit={canEdit}
                canDelete={canDelete}
                embedded
                onView={setSelected}
                onPay={setPayFor}
                onEdit={setEditFor}
                onDelete={setDeleteFor}
                emptyState={
                  hasFilters
                    ? {
                        title: "Filterə uyğun müştəri yoxdur",
                        description: "Axtarışı və ya filterləri dəyişin.",
                      }
                    : undefined
                }
              />
              {!isLoading && filtered.length > 0 && (
                <p className="flex items-center justify-end gap-1.5 px-1 text-xs text-stone-500">
                  <span>Görünən:</span>
                  <span className="font-semibold tabular-nums text-stone-700">
                    {filtered.length} müştəri
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold tabular-nums text-stone-700">
                    {fmtMoney(filteredDebt)}
                  </span>
                  {hasFilters && (
                    <span className="text-stone-400">(filtrə uyğun)</span>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

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
      <EditCustomerModal
        open={!!editFor}
        onClose={() => setEditFor(null)}
        customer={
          editFor
            ? (customers.find((c) => c.id === editFor.id) ?? editFor)
            : null
        }
      />
      <ConfirmModal
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        onConfirm={() => void handleDelete()}
        title="Müştərini sil"
        message={
          deleteFor && deleteFor.remainingDebt > 0
            ? `Diqqət: ${deleteFor.name} müştərisinin ${fmtMoney(deleteFor.remainingDebt)} borcu var. Silinsə, borc məlumatı da itəcək. Bu əməliyyat geri alına bilməz. Silmək istədiyinizə əminsiniz?`
            : `${deleteFor?.name ?? "Bu müştəri"} silinəcək. Bu əməliyyat geri alına bilməz.`
        }
        confirmText="Sil"
        danger
      />
    </div>
  );
}
