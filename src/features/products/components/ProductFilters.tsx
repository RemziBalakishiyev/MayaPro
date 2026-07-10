import { Search } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { inputCls } from "@/components/ui/Input";
import type { ProductStatus } from "@/types";

export interface ProductFilterValues {
  q?: string;
  cat?: string;
  status?: ProductStatus;
  loc?: string;
}

const STATUSES: ProductStatus[] = [
  "Stokda var",
  "Azalır",
  "Bitib",
  "Satılmır",
  "Ziyana satılır",
];

interface Props {
  value: ProductFilterValues;
  categories: string[];
  locations: string[];
  onChange: (patch: ProductFilterValues) => void;
}

/** Mal filtrləri — dəyərlər URL search params-da saxlanılır. */
export function ProductFilters({
  value,
  categories,
  locations,
  onChange,
}: Props) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
      <div className="relative col-span-2 md:col-span-1">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          value={value.q ?? ""}
          onChange={(e) => onChange({ q: e.target.value || undefined })}
          placeholder="Ad, model, rəng üzrə axtar..."
          className={`${inputCls} pl-8`}
        />
      </div>

      <Select
        value={value.cat ?? ""}
        onChange={(e) => onChange({ cat: e.target.value || undefined })}
      >
        <option value="">Bütün kateqoriyalar</option>
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </Select>

      <Select
        value={value.status ?? ""}
        onChange={(e) =>
          onChange({ status: (e.target.value || undefined) as ProductStatus | undefined })
        }
      >
        <option value="">Bütün statuslar</option>
        {STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </Select>

      <Select
        value={value.loc ?? ""}
        onChange={(e) => onChange({ loc: e.target.value || undefined })}
      >
        <option value="">Bütün anbarlar</option>
        {locations.map((l) => (
          <option key={l}>{l}</option>
        ))}
      </Select>
    </div>
  );
}
