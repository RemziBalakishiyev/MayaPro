import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";

export const Route = createFileRoute("/_app/mallar")({
  component: Page,
});

function Page() {
  return <PageHead title="Mallar" subtitle="Məhsullar cədvəli" />;
}
