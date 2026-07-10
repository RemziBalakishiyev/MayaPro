import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";

export const Route = createFileRoute("/_app/tedarukculer")({
  component: Page,
});

function Page() {
  return <PageHead title="Təchizatçılar" subtitle="Təchizatçı hesabları" />;
}
