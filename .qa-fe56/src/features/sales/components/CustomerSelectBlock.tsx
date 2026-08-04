import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CustomerPicker } from "@/components/ui/CustomerPicker";
import { cn } from "@/lib/cn";
import type { Customer } from "@/types";

interface Props {
  customers: Customer[];
  customerId: string;
  setCustomerId: (v: string) => void;
  onNewCustomer: (prefillName?: string) => void;
  /**
   * Qalıq borclu satışda müştəri məcburidir (backend `SaleWriteValidator` ilə
   * eyni qayda) — başlıqda `*`, seçilməyibsə amber xəbərdarlıq göstərilir.
   */
  required?: boolean;
  /** Məcburi olduqda göstərilən izah mətni. */
  requiredHint?: string;
}

/**
 * Satış axınında müştəri seçimi — həm satış formasında (istəyə bağlı), həm də
 * ödəniş modalında (qalıq borcda məcburi) eyni komponent istifadə olunur ki,
 * görünüş və davranış iki yerdə ayrı-ayrı saxlanılmasın (FE#25 review).
 */
export function CustomerSelectBlock({
  customers,
  customerId,
  setCustomerId,
  onNewCustomer,
  required = false,
  requiredHint,
}: Props) {
  const missing = required && !customerId;
  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        missing ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white",
      )}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-stone-600">
          Müştəri
          {required ? (
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          ) : (
            <span className="ml-1 font-normal text-stone-400">
              (istəyə bağlı)
            </span>
          )}
        </p>
        {!!customerId && (
          <button
            type="button"
            onClick={() => setCustomerId("")}
            className="-mr-1 min-h-[44px] px-2 text-xs font-semibold text-stone-500 hover:text-emerald-700"
          >
            Sil
          </button>
        )}
      </div>
      <CustomerPicker
        customers={customers}
        value={customerId}
        onChange={setCustomerId}
        onCreateNew={onNewCustomer}
      />
      <Button
        variant="secondary"
        size="lg"
        className="mt-2 w-full justify-center"
        icon={<Plus size={18} />}
        onClick={() => onNewCustomer()}
      >
        Yeni müştəri
      </Button>
      {missing && requiredHint && (
        <p className="mt-2 text-sm font-semibold text-amber-800">
          {requiredHint}
        </p>
      )}
    </div>
  );
}
