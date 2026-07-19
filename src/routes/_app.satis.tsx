import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { QuickSaleScreen } from "@/features/sales/components/QuickSaleScreen";

const optNum = z.preprocess((v) => {
  if (v == null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const searchSchema = z.object({
  period: z.enum(["today", "week", "month", "all"]).default("today"),
  pay: z.enum(["Nağd", "Kart", "Nisyə"]).optional(),
  q: z.string().optional(),
  minProfit: optNum,
  maxProfit: optNum,
  minQty: optNum,
  maxQty: optNum,
});

export const Route = createFileRoute("/_app/satis")({
  validateSearch: searchSchema,
  component: SatisPage,
});

function SatisPage() {
  return <QuickSaleScreen />;
}
