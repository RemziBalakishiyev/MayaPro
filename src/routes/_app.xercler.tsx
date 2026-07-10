import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";

export const Route = createFileRoute("/_app/xercler")({
  component: Page,
});

function Page() {
  return <PageHead title="Xərclər" subtitle="Xərc qeydləri" />;
}
