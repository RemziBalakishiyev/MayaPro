import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { CheckCircle2, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Field } from "@/components/ui/Field";
import { useAuthStore } from "@/features/auth/store";
import { authApi } from "@/features/auth/api";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/qeydiyyat")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (user) throw redirect({ to: user.role === "platform_admin" ? "/admin" : "/" });
  },
  component: RegisterPage,
});

interface RegisterFormValues {
  storeName: string;
  ownerName: string;
  phone: string;
  password: string;
}

const MIN_PASSWORD_LENGTH = 6;

function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: { storeName: "", ownerName: "", phone: "", password: "" },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      // FE#183 (AC-2) — token yazılmır, istifadəçi login edilmir; yalnız
      // "qəbul olundu" ekranı göstərilir.
      await authApi.register({
        storeName: data.storeName.trim(),
        ownerName: data.ownerName.trim(),
        phone: data.phone.trim(),
        password: data.password,
      });
      setDone(true);
    } catch (e) {
      setServerError(
        e instanceof ApiError
          ? e.message
          : "Qeydiyyat alınmadı. Bağlantını yoxlayın.",
      );
    }
  };

  if (done) {
    return (
      <div className="flex min-h-full items-center justify-center bg-stone-100 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <CheckCircle2 size={28} aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-stone-900">Müraciətiniz qəbul olundu</h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Müraciətiniz qəbul olundu — təsdiqdən sonra sizə xəbər veriləcək.
          </p>
          <Link to="/login" className="mt-6 block">
            <Button variant="secondary" className="w-full justify-center">
              Girişə qayıt
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/40">
            <Store size={22} className="text-emerald-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900">Yeni mağaza qeydiyyatı</h1>
            <p className="text-sm text-stone-500">Məlumatları doldurub müraciət göndərin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Mağaza adı" required error={errors.storeName?.message}>
            <Input
              autoFocus
              {...register("storeName", { required: "Mağaza adı boş ola bilməz" })}
              placeholder="Sədərək Market"
            />
          </Field>
          <Field label="Sahibkarın adı" required error={errors.ownerName?.message}>
            <Input
              {...register("ownerName", { required: "Sahibkar adı boş ola bilməz" })}
              placeholder="Ad Soyad"
            />
          </Field>
          <Field label="Telefon" required error={errors.phone?.message}>
            <Controller
              name="phone"
              control={control}
              rules={{
                validate: (v) =>
                  v.trim() !== "" || "Telefon nömrəsi mütləqdir",
              }}
              render={({ field }) => (
                <PhoneInput value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>
          <Field
            label="Şifrə"
            required
            hint={`Ən azı ${MIN_PASSWORD_LENGTH} simvol`}
            error={errors.password?.message}
          >
            <Input
              type="password"
              autoComplete="new-password"
              {...register("password", {
                required: "Şifrə boş ola bilməz",
                minLength: {
                  value: MIN_PASSWORD_LENGTH,
                  message: `Şifrə ən azı ${MIN_PASSWORD_LENGTH} simvol olmalıdır`,
                },
              })}
              placeholder="••••••"
            />
          </Field>

          {serverError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            className="w-full justify-center"
          >
            Qeydiyyatdan keç
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-stone-500">
          Artıq hesabınız var?{" "}
          <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
            Daxil olun
          </Link>
        </p>
      </div>
    </div>
  );
}
