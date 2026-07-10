import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";

export const Route = createFileRoute("/_app/satis")({
  component: Page,
});

function Page() {
  return <PageHead title="Satış" subtitle="Sürətli satış ekranı" />;
}
