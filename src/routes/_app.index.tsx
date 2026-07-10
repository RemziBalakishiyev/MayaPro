import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";

export const Route = createFileRoute("/_app/")({
  component: Page,
});

function Page() {
  return <PageHead title="Dashboard" subtitle="Ümumi baxış" />;
}
