import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";
import { Card } from "@/components/ui/Card";
import { QuickSaleScreen } from "@/features/sales/components/QuickSaleScreen";
import { TodaySalesList } from "@/features/sales/components/TodaySalesList";
import { useTodaySales } from "@/features/sales/queries";

export const Route = createFileRoute("/_app/satis")({
  component: SatisPage,
});

function SatisPage() {
  const { data: todaySales = [] } = useTodaySales();

  return (
    <div className="space-y-5">
      <PageHead
        title="Satış"
        subtitle="Sürətli satış ekranı — 10 saniyəyə satışı tamamla"
      />

      <QuickSaleScreen />

      <Card title={`Bugünkü satışlar (${todaySales.length})`}>
        <TodaySalesList sales={todaySales} />
      </Card>
    </div>
  );
}
