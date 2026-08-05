import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/store";
import { authApi } from "@/features/auth/api";
import { ApiError, USE_MOCK } from "@/lib/api-client";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    // Artıq daxil olubsa dashboard-a yönləndir
    if (useAuthStore.getState().user) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

interface LoginFormValues {
  phone: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { phone: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      const { user, token } = await authApi.login(
        data.phone.trim(),
        data.password,
      );
      login(user, token);
      navigate({ to: "/" });
    } catch (e) {
      setServerError(
        e instanceof ApiError
          ? e.message
          : "Giriş alınmadı. Bağlantını yoxlayın.",
      );
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/40">
            <Store size={22} className="text-emerald-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900">Sədərək Sistem</h1>
            <p className="text-sm text-stone-500">Hesabınıza daxil olun</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Telefon" error={errors.phone?.message}>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="username"
              {...register("phone", {
                required: "Telefon nömrəsi mütləqdir",
              })}
              placeholder="0501112233"
            />
          </Field>
          <Field label="Şifrə" error={errors.password?.message}>
            <Input
              type="password"
              autoComplete="current-password"
              {...register("password", { required: "Şifrə mütləqdir" })}
              placeholder="••••••"
            />
          </Field>

          {serverError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200">
              {serverError}
            </div>
          )}

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

        {import.meta.env.DEV && !USE_MOCK && (
          <div className="mt-6 rounded-lg bg-stone-50 px-3 py-2.5 text-[11px] leading-relaxed text-stone-500 ring-1 ring-stone-200">
            <p className="mb-1 font-semibold text-stone-600">Demo girişlər (yalnız DEV)</p>
            <p>Sahib — 0501112233</p>
            <p>Menecer — 0552223344</p>
            <p>Satıcı — 0553334455</p>
            <p className="mt-1">Şifrə: <b>demo123</b></p>
          </div>
        )}
      </div>
    </div>
  );
}
