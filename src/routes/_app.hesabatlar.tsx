import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";

export const Route = createFileRoute("/_app/hesabatlar")({
  component: Page,
});

function Page() {
  return <PageHead title="Hesabatlar" subtitle="Satış və qazanc analitikası" />;
}
