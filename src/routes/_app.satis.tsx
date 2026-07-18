import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { QuickSaleScreen } from "@/features/sales/components/QuickSaleScreen";

const searchSchema = z.object({
  period: z.enum(["today", "week", "month", "all"]).default("today"),
  pay: z.enum(["Nağd", "Kart", "Nisyə"]).optional(),
});

export const Route = createFileRoute("/_app/satis")({
  validateSearch: searchSchema,
  component: SatisPage,
});

function SatisPage() {
  return <QuickSaleScreen />;
}
