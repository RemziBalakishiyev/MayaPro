import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";

export const Route = createFileRoute("/_app/ayarlar")({
  component: Page,
});

function Page() {
  return <PageHead title="Ayarlar" subtitle="Sistem parametrləri" />;
}
