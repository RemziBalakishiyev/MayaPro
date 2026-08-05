import { StatusBadge } from "@/components/ui/StatusBadge";
import { productStatus } from "../lib";
import type { Product, ProductStatus } from "@/types";
import type { SemanticTone } from "@/lib/ui-tokens";

interface Props {
  product: Product;
  lastSaleDate?: string | null;
}

/**
 * Mal statusu → semantik ton (FE#126). Rəng heç vaxt YEGANƏ göstərici deyil —
 * `StatusBadge` hər zaman ikon + status mətnini birlikdə göstərir.
 */
const STATUS_TONE: Record<ProductStatus, SemanticTone> = {
  "Stokda var": "success",
  Azalır: "warning",
  Bitib: "danger",
  Satılmır: "info",
  "Ziyana satılır": "danger",
};

/** Malın statusunu hesablayıb semantik `StatusBadge` kimi göstərir. */
export function ProductStatusBadge({ product, lastSaleDate }: Props) {
  const status = productStatus(product, lastSaleDate);
  return <StatusBadge tone={STATUS_TONE[status]}>{status}</StatusBadge>;
}
