import { Badge } from "@/components/ui/Badge";
import { productStatus } from "../lib";
import type { Product } from "@/types";

interface Props {
  product: Product;
  lastSaleDate?: string | null;
}

/** Malın statusunu hesablayıb rəngli Badge kimi göstərir. */
export function ProductStatusBadge({ product, lastSaleDate }: Props) {
  const status = productStatus(product, lastSaleDate);
  return <Badge tone={status}>{status}</Badge>;
}
