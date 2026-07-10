import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";

export const Route = createFileRoute("/_app/borclar")({
  component: Page,
});

function Page() {
  return <PageHead title="Nisyə Borclar" subtitle="Müştəri borcları" />;
}
