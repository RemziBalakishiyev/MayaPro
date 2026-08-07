import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DayEndCard } from "@/features/day-end/components/DayEndCard";
import { ClosingHistory } from "@/features/day-end/components/ClosingHistory";

export const Route = createFileRoute("/_app/gun-sonu")({
  component: GunSonuPage,
});

function GunSonuPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Gün Sonu Bağlanış"
        subtitle="Günün sonunda kassadakı nağd pulu sayıb bura yazın — sistem özü yoxlayacaq"
      />

      <DayEndCard />

      <Card title="Əvvəlki bağlanışlar">
        <ClosingHistory />
      </Card>
    </div>
  );
}
