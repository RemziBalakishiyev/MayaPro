import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { LogIn, PackageSearch, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NotFoundCard } from "@/components/ui/NotFoundCard";
import { useAuthStore } from "@/features/auth/store";

/**
 * FE#189 — Qlobal 404 (`__root.tsx`-in `notFoundComponent`-i). Tək bir kök
 * komponentdən kontekstə görə 3 variant göstərilir (ayrı-ayrı route-larda
 * `notFoundComponent` təkrarlamaq əvəzinə — TanStack Router-in unmatched
 * child üçün ən yaxın matched valideynin notFound-unu tapması qeyri-müəyyən
 * ola bildiyi üçün TƏK mənbədən idarə olunur):
 *
 * - `/admin/*` altında           → admin bölməsinin dilində (bənd 4)
 * - daxil olmuş mağaza istifadəçisi → panel üslubu: [Ana səhifəyə qayıt] (/panel) + [Geri qayıt]
 * - daxil olmayıb                → landing üslubu: [Ana səhifə] (/) + [Daxil ol]
 */
export function NotFoundPage() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const goBack = () => {
    // TanStack Router-in history sarğısı — brauzerin `history.back()`-i ilə eyni.
    router.history.back();
  };

  const backButton = (
    <Button
      type="button"
      variant="secondary"
      className="w-full justify-center sm:w-auto"
      onClick={goBack}
    >
      Geri qayıt
    </Button>
  );

  if (location.pathname.startsWith("/admin")) {
    return (
      <div className="min-h-full bg-stone-100">
        {/* admin.tsx-dəki başlıq zolağının HİSSƏSİ — admin bölməsinin "dili" (bənd 4) */}
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-4 sm:px-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-400/40">
              <ShieldCheck size={20} />
            </span>
            <h1 className="text-lg font-bold text-stone-900">Platforma Admin</h1>
          </div>
        </header>
        <NotFoundCard
          className="min-h-0 bg-transparent py-16"
          actions={
            <>
              <Link to="/admin" className="w-full sm:w-auto">
                <Button className="w-full justify-center">
                  Admin panelinə qayıt
                </Button>
              </Link>
              {backButton}
            </>
          }
        />
      </div>
    );
  }

  if (user) {
    return (
      <NotFoundCard
        actions={
          <>
            <Link to="/panel" className="w-full sm:w-auto">
              <Button className="w-full justify-center">
                Ana səhifəyə qayıt
              </Button>
            </Link>
            {backButton}
          </>
        }
      />
    );
  }

  return (
    <NotFoundCard
      icon={PackageSearch}
      actions={
        <>
          <Link to="/" className="w-full sm:w-auto">
            <Button className="w-full justify-center">Ana səhifə</Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full justify-center"
              icon={<LogIn size={16} />}
            >
              Daxil ol
            </Button>
          </Link>
        </>
      }
    />
  );
}
