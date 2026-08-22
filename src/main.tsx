import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { Toasts } from "@/components/ui/Toast";
import { verifyStoredSession } from "@/features/auth/session";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toasts />
    </QueryClientProvider>
  </StrictMode>,
);

// İlk render-i gözlətmədən saxlanılmış sessiyanı serverlə uzlaşdır. Rol
// dəyişibsə (məs. localStorage-da köhnə `sahib` qalıb, əslində isə istifadəçi
// platforma adminidir) router-i etibarsız elan edirik ki, marşrut guard-ları
// yenidən işləsin və istifadəçi öz interfeysinə keçsin.
void verifyStoredSession().then((changed) => {
  if (changed) void router.invalidate();
});
