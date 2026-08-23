import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * FE#189 (bənd 3/5) — route-level `errorComponent`: gözlənilməz render
 * xətasında ağ ekran əvəzinə "Nəsə səhv getdi" kartı. Xəta UDULMUR — tam
 * stack ilə `console.error`-a yazılır (dev-də görünür, prod-da da console-da
 * qalır ki, gələcək diaqnostika mümkün olsun).
 *
 * [Yenidən yüklə]: əvvəlcə error boundary-ni sıfırlayır (`reset`) və
 * route-u `router.invalidate()` ilə yenidən yükləməyə çalışır (tam səhifə
 * reload DEYİL) — bu alınmazsa `window.location.reload()`-a keçir.
 */
export function RouteErrorCard({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line no-console -- qəsdən: diaqnostika üçün xəta udulmamalıdır (bənd 5)
    console.error(
      "[RouteErrorCard] Route render xətası:",
      error,
      error instanceof Error ? error.stack : undefined,
    );
  }, [error]);

  const handleReload = () => {
    try {
      reset();
      void router.invalidate().catch(() => {
        window.location.reload();
      });
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
          <AlertTriangle size={30} aria-hidden />
        </div>
        <h1 className="text-xl font-bold text-stone-900">Nəsə səhv getdi</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Gözlənilməz bir xəta baş verdi. Zəhmət olmasa yenidən cəhd edin —
          problem davam edərsə dəstəklə əlaqə saxlayın.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-6 w-full justify-center"
          icon={<RotateCw size={16} />}
          onClick={handleReload}
        >
          Yenidən yüklə
        </Button>
      </div>
    </div>
  );
}
