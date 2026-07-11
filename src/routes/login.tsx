import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Store, Loader2 } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { authApi } from "@/features/auth/api";
import { ApiError, USE_MOCK } from "@/lib/api-client";

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

function LoginPage() {
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
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Telefon
            </label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="username"
              {...register("phone", {
                required: "Telefon nömrəsi mütləqdir",
              })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="0501112233"
            />
            {errors.phone && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Şifrə
            </label>
            <input
              type="password"
              autoComplete="current-password"
              {...register("password", { required: "Şifrə mütləqdir" })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Daxil ol
          </button>
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
