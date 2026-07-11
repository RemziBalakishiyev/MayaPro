import { createFileRoute } from "@tanstack/react-router";
import { QuickSaleScreen } from "@/features/sales/components/QuickSaleScreen";

export const Route = createFileRoute("/_app/satis")({
  component: SatisPage,
});

function SatisPage() {
  return <QuickSaleScreen />;
}
