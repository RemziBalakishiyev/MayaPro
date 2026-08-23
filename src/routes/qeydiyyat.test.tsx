import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentType, ReactNode } from "react";

/**
 * FE#183 (AC-1/AC-2/AC-3, TC-01/TC-02/TC-03) — qeydiyyat forması: happy path
 * (token yazılmır, "qəbul olundu" ekranı görünür), boş sahə validasiyası,
 * server xətasında forma məlumatları itmir.
 *
 * `RegisterPage` `useRegisterTenant` (react-query `useMutation`) çağırır —
 * `QueryClientProvider`-siz mühitdə xəta atır (bax `QuickSaleScreen.test.tsx`-
 * dəki eyni naxış), ona görə burada `authApi` yox, birbaşa mutasiya hook-u
 * mocklanır.
 */
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );
  return {
    ...actual,
    Link: ({ children, to, ...rest }: { children?: ReactNode; to?: string }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  };
});

vi.mock("@/features/auth/queries", () => ({
  useRegisterTenant: vi.fn(),
}));

import { Route } from "./qeydiyyat";
import { useRegisterTenant } from "@/features/auth/queries";
import { useAuthStore } from "@/features/auth/store";

const RegisterPage = Route.options.component as ComponentType;
const mockUseRegisterTenant = vi.mocked(useRegisterTenant);

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Sədərək Market"), "Test Market");
  await user.type(screen.getByPlaceholderText("Ad Soyad"), "Elvin Məmmədov");
  await user.type(screen.getByPlaceholderText("50 123 45 67"), "501112233");
  await user.type(screen.getByPlaceholderText("••••••"), "demo123");
}

describe("/qeydiyyat", () => {
  let mutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mutateAsync = vi.fn();
    mockUseRegisterTenant.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);
    useAuthStore.setState({ user: null, token: null });
  });

  it("TC-01 — uğurlu qeydiyyatda 'Müraciətiniz qəbul olundu' ekranı görünür, sessiya yazılmır", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({
      tenantId: "t1",
      storeName: "Test Market",
      status: "PendingApproval",
      message: "Qəbul edildi",
    });

    render(<RegisterPage />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /qeydiyyatdan keç/i }));

    expect(
      await screen.findByRole("heading", { name: /Müraciətiniz qəbul olundu/i }),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(screen.getByRole("link", { name: /girişə qayıt/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  // FE#190 — "qəbul olundu" ekranında mağaza adı + telefonla WhatsApp bildiriş linki.
  it("uğurlu qeydiyyatdan sonra WhatsApp bildiriş düyməsi mağaza adı və telefonla düzgün linkə yönəlir", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({
      tenantId: "t1",
      storeName: "Test Market",
      status: "PendingApproval",
      message: "Qəbul edildi",
    });

    render(<RegisterPage />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /qeydiyyatdan keç/i }));

    const waLink = await screen.findByRole("link", {
      name: /whatsapp-la qeydiyyatını bildir/i,
    });
    const href = waLink.getAttribute("href") ?? "";
    expect(href).toContain("https://wa.me/994508712603?text=");
    expect(decodeURIComponent(href)).toContain("Mağaza: Test Market");
    expect(decodeURIComponent(href)).toContain("Telefon: 994501112233");
    expect(
      screen.getByText("Bir mesajla admin qeydiyyatını görüb təsdiqləyəcək"),
    ).toBeInTheDocument();
  });

  it("TC-02 — boş formada validasiya xətaları göstərilir, backend çağırılmır", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: /qeydiyyatdan keç/i }));

    expect(await screen.findByText("Mağaza adı boş ola bilməz")).toBeInTheDocument();
    expect(screen.getByText("Sahibkar adı boş ola bilməz")).toBeInTheDocument();
    expect(screen.getByText("Şifrə boş ola bilməz")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  // FE#188 — PhoneInput natamam nömrə (9 yerli rəqəmdən az) ilə submit-i bloklamalıdır.
  it("natamam telefon nömrəsi ilə submit ediləndə 'Nömrəni tam yazın' xətası göstərilir, backend çağırılmır", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("Sədərək Market"), "Test Market");
    await user.type(screen.getByPlaceholderText("Ad Soyad"), "Elvin Məmmədov");
    await user.type(screen.getByPlaceholderText("50 123 45 67"), "5011");
    await user.type(screen.getByPlaceholderText("••••••"), "demo123");
    await user.click(screen.getByRole("button", { name: /qeydiyyatdan keç/i }));

    expect(await screen.findByText("Nömrəni tam yazın")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("TC-03 — server xətasında forma açıq qalır, mesaj göstərilir, məlumatlar itmir", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@/lib/api-client");
    mutateAsync.mockRejectedValue(
      new ApiError("Bu telefon nömrəsi artıq qeydiyyatdan keçib", "Conflict", 409),
    );

    render(<RegisterPage />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /qeydiyyatdan keç/i }));

    expect(
      await screen.findByText("Bu telefon nömrəsi artıq qeydiyyatdan keçib"),
    ).toBeInTheDocument();
    // Forma hələ də görünür (uğur ekranına keçməyib) və doldurulmuş dəyər qalır.
    expect(screen.getByRole("button", { name: /qeydiyyatdan keç/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Sədərək Market")).toHaveValue("Test Market");

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });
  });
});
