import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";

export const Route = createFileRoute("/_app/gun-sonu")({
  component: Page,
});

function Page() {
  return <PageHead title="Gün Sonu" subtitle="Kassa bağlanışı" />;
}
