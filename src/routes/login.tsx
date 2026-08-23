import { useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { InlineError } from "@/components/ui/InlineError";
import { useAuthStore, setRememberMe } from "@/features/auth/store";
import { authApi } from "@/features/auth/api";
import { rememberLastLoginPhone } from "@/features/auth/lastLoginPhone";
import { ApiError, USE_MOCK } from "@/lib/api-client";
import { isPhoneIncomplete } from "@/lib/phone";
import { Field } from "@/components/ui/Field";
import { AuthBackground } from "./-auth-background";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    // Artıq daxil olubsa uyğun yerə yönləndir — platforma admini /admin-ə,
    // adi mağaza istifadəçisi dashboard-a (AC-8).
    const user = useAuthStore.getState().user;
    if (user) {
      throw redirect({ to: user.role === "platform_admin" ? "/admin" : "/panel" });
    }
  },
  component: LoginPage,
});

interface LoginFormValues {
  phone: string;
  password: string;
  rememberMe: boolean;
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    // FE#187 (AC-1) — Sədərək bazarında telefondan giriş edən alverçi üçün
    // "yadda saxla" rahatlıq default olaraq AÇIQDIR; istəyən sönə bilər.
    defaultValues: { phone: "", password: "", rememberMe: true },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      // Checkbox seçimi sorğudan ƏVVƏL yazılır ki, uğurlu girişdə auth
      // store-un dinamik persist adapteri düzgün yaddaşa (localStorage
      // "yadda saxla" AÇIQ — 30 gün, ya sessionStorage — tab bağlanana qədər)
      // yazsın (bax `features/auth/store.ts`).
      setRememberMe(data.rememberMe);
      // FE#190 — 403 PendingApproval tam səhifə yönləndirməsi ilə baş verir
      // (bax `lib/api-client.ts`), React state itir; nömrə körpü kimi
      // sessionStorage-a yazılır ki, `/hesab-bloklu` WhatsApp mesajında görünsün.
      rememberLastLoginPhone(data.phone.trim());
      const { user, token } = await authApi.login(
        data.phone.trim(),
        data.password,
        data.rememberMe,
      );
      login(user, token);
      // FE#183 (AC-8) — platforma admini birbaşa /admin-ə, adi istifadəçi dashboard-a.
      navigate({ to: user.role === "platform_admin" ? "/admin" : "/panel" });
    } catch (e) {
      setServerError(
        e instanceof ApiError
          ? e.message
          : "Giriş alınmadı. Bağlantını yoxlayın.",
      );
    }
  };

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-stone-50 p-4 py-10">
      {/*
       * FE#187 — fon: landing (`HeroSection`) ilə eyni rəng ailəsi (emerald-
       * stone), lakin YÜNGÜL versiya: tünd `bg-emerald-950` yerinə açıq isti
       * fon üzərində incə radial parıltı + şəbəkə naxışı. Şəkil yoxdur (0 kB
       * şəbəkə yükü), CLS riski yoxdur. `/qeydiyyat` ilə paylaşılan komponent.
       */}
      <AuthBackground />

      <div className="relative w-full max-w-sm">
        <div className="rounded-card bg-white p-6 shadow-panel ring-1 ring-stone-200 sm:p-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/40">
              <Store size={26} className="text-emerald-700" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-stone-900">Sədərək Anbar</h1>
              <p className="mt-1 text-sm text-stone-500">Sistemə daxil ol</p>
            </div>
          </div>

          {serverError && (
            <div className="mb-4">
              <InlineError message={serverError} />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label="Telefon" error={errors.phone?.message}>
              <Controller
                name="phone"
                control={control}
                rules={{
                  validate: (v) => {
                    if (!v || v.trim() === "") return "Telefon nömrəsi mütləqdir";
                    if (isPhoneIncomplete(v)) return "Nömrəni tam yazın";
                    return true;
                  },
                }}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    autoComplete="username"
                    size="lg"
                  />
                )}
              />
            </Field>
            <Field label="Şifrə" error={errors.password?.message}>
              <PasswordInput
                size="lg"
                autoComplete="current-password"
                {...register("password", { required: "Şifrə mütləqdir" })}
                placeholder="••••••"
              />
            </Field>

            <Checkbox
              label="Hesabı yadda saxla"
              description="Bu cihazda 30 gün yadda qalacaq"
              {...register("rememberMe")}
            />

            {/* FE#69 — paylaşılan `Button` + `loading` propu (F-42): əl ilə
                yazılmış Loader2 naxışı əvəz olundu, hündürlük 52px-ə çatdı
                (FE#119: `size="lg"` DS Button min-h-[52px] + `focus-ring` +
                avtomatik `aria-busy` — 40px minimum toxunma hədəfini artıqlaması
                ilə ödəyir, əl ilə Loader2/disabled təkrarına ehtiyac yoxdur). */}
            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full justify-center"
            >
              Daxil ol
            </Button>
          </form>
        </div>

        {/* FE#187 — kartın altındakı keçidlər: qeydiyyat (vurğulu) + ana səhifə. */}
        <div className="mt-6 space-y-3 text-center text-sm">
          <p className="text-stone-500">
            Hesabınız yoxdur?{" "}
            <Link
              to="/qeydiyyat"
              className="font-bold text-emerald-700 hover:underline"
            >
              Yeni mağaza qeydiyyatı
            </Link>
          </p>
          <Link
            to="/"
            className="focus-ring inline-flex items-center gap-1.5 rounded-chip px-2 py-1 font-medium text-stone-500 transition-colors hover:text-stone-700"
          >
            <ArrowLeft size={15} aria-hidden />
            Ana səhifə
          </Link>
        </div>

        {/* Yalnız DEV build-də görünür — kiçik, kənarda (masaüstündə künc). */}
        {import.meta.env.DEV && !USE_MOCK && (
          <div className="mt-6 rounded-lg border border-dashed border-stone-300 bg-white/70 px-3 py-2.5 text-[11px] leading-relaxed text-stone-500 sm:fixed sm:bottom-4 sm:right-4 sm:mt-0 sm:max-w-[220px] sm:shadow-card">
            <p className="mb-1 font-semibold text-stone-600">Demo girişlər (yalnız DEV)</p>
            <p>Sahib — 0501112233</p>
            <p>Menecer — 0552223344</p>
            <p>Satıcı — 0553334455</p>
            <p className="mt-1">
              Şifrə: <b>demo123</b>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
