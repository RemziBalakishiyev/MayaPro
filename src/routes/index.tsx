import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store";
import { LandingPage } from "@/features/landing/components/LandingPage";

/**
 * Saytın kökü — public landing.
 *
 * Daxil olmuş istifadəçi burada saxlanılmır: mağaza sahibi `/panel`-ə,
 * platforma admini `/admin`-ə yönləndirilir (FE#183 rol qaydası ilə eyni).
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (user) {
      throw redirect({ to: user.role === "platform_admin" ? "/admin" : "/panel" });
    }
  },
  component: LandingPage,
});
