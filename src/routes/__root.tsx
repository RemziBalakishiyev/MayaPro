import { createRootRoute, Outlet } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/ui/NotFoundPage";
import { RouteErrorCard } from "@/components/ui/RouteErrorCard";

/**
 * FE#189 — kök route-da bağlanan qlobal fallback-lar:
 * - `notFoundComponent`: heç bir route uyğun gəlmədikdə (404) — `NotFoundPage`
 *   auth/admin kontekstinə görə düzgün variantı özü seçir.
 * - `errorComponent`: gözlənilməz render xətasında ağ ekran əvəzinə
 *   "Nəsə səhv getdi" kartı (xəta udulmur, `console.error`-a yazılır).
 */
export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteErrorCard,
});
