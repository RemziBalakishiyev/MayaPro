import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";

export const Route = createFileRoute("/_app/iscilar")({
  component: Page,
});

function Page() {
  return <PageHead title="İşçilər" subtitle="İşçi idarəetməsi" />;
}
