import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { ArrowLeft, CheckCircle2, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Field } from "@/components/ui/Field";
import { InlineError } from "@/components/ui/InlineError";
import { useAuthStore } from "@/features/auth/store";
import { useRegisterTenant } from "@/features/auth/queries";
import { ApiError } from "@/lib/api-client";
import { AuthBackground } from "./-auth-background";

export const Route = createFileRoute("/qeydiyyat")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (user)
      throw redirect({
        to: user.role === "platform_admin" ? "/admin" : "/panel",
      });
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
  const registerMut = useRegisterTenant();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: { storeName: "", ownerName: "", phone: "", password: "" },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      // FE#183 (AC-2) — token yazılmır, istifadəçi login edilmir; yalnız
      // "qəbul olundu" ekranı göstərilir.
      await registerMut.mutateAsync({
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
      <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-stone-50 p-4 py-10">
        <AuthBackground />
        <div className="relative w-full max-w-sm rounded-card bg-white p-6 text-center shadow-panel ring-1 ring-stone-200 sm:p-8">
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
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-stone-50 p-4 py-10">
      <AuthBackground />
      <div className="relative w-full max-w-sm">
        <div className="rounded-card bg-white p-6 shadow-panel ring-1 ring-stone-200 sm:p-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/40">
              <Store size={26} className="text-emerald-700" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-stone-900">Yeni mağaza qeydiyyatı</h1>
              <p className="mt-1 text-sm text-stone-500">Məlumatları doldurub müraciət göndərin</p>
            </div>
          </div>

          {serverError && (
            <div className="mb-4">
              <InlineError message={serverError} />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label="Mağaza adı" required error={errors.storeName?.message}>
              <Input
                size="lg"
                autoFocus
                {...register("storeName", { required: "Mağaza adı boş ola bilməz" })}
                placeholder="Sədərək Market"
              />
            </Field>
            <Field label="Sahibkarın adı" required error={errors.ownerName?.message}>
              <Input
                size="lg"
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
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    className="!h-[52px]"
                  />
                )}
              />
            </Field>
            <Field
              label="Şifrə"
              required
              hint={`Ən azı ${MIN_PASSWORD_LENGTH} simvol`}
              error={errors.password?.message}
            >
              <PasswordInput
                size="lg"
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

            <Button
              type="submit"
              size="lg"
              loading={registerMut.isPending}
              className="w-full justify-center"
            >
              Qeydiyyatdan keç
            </Button>
          </form>
        </div>

        <div className="mt-6 space-y-3 text-center text-sm">
          <p className="text-stone-500">
            Artıq hesabınız var?{" "}
            <Link to="/login" className="font-bold text-emerald-700 hover:underline">
              Daxil olun
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
      </div>
    </div>
  );
}
