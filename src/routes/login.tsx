import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Store } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { uid } from "@/lib/format";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    // Artıq daxil olubsa dashboard-a yönləndir
    if (useAuthStore.getState().user) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

interface LoginForm {
  username: string;
  password: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const { register, handleSubmit } = useForm<LoginForm>({
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    // Mock: istənilən dəyərlə daxil olur
    login({
      id: uid("user"),
      name: data.username.trim() || "İstifadəçi",
      role: "sahib",
    });
    navigate({ to: "/" });
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              İstifadəçi adı
            </label>
            <input
              {...register("username")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Şifrə
            </label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-700 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Daxil ol
          </button>
        </form>
      </div>
    </div>
  );
}
