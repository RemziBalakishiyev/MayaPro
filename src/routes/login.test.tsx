import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "./login";
import { authApi } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { ApiError } from "@/lib/api-client";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  redirect: vi.fn(),
  useNavigate: () => mockNavigate,
  // FE#183 — login.tsx "Yeni mağaza qeydiyyatı" / "Ana səhifə" keçidləri üçün `Link` istifadə edir.
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/auth/api", () => ({
  authApi: { login: vi.fn() },
}));

/**
 * FE#187 — login yenidən dizayn: "Hesabı yadda saxla" (defolt AÇIQ, dinamik
 * localStorage/sessionStorage persist), şifrəni göstər/gizlət toqql, yeni
 * vizual struktur (InlineError, "Ana səhifə" keçidi).
 *
 * `useAuthStore`-un dinamik storage adapterinin özü `store.test.ts`-də ayrıca
 * yoxlanılır — burada YALNIZ login formunun bu davranışı DÜZGÜN TƏTBİQ
 * ETDİYİ (checkbox dəyəri `setRememberMe` + `authApi.login`-ə ötürülür)
 * təsdiqlənir.
 */
describe("LoginPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.mocked(authApi.login).mockReset();
    useAuthStore.setState({ user: null, token: null });
    localStorage.clear();
    sessionStorage.clear();
  });

  it("DS primitivlərindən istifadə edir — telefon/şifrə input-ları 52px, submit düyməsi min-h-[52px] hündürlük tokeni daşıyır", () => {
    render(<LoginPage />);

    const phoneInput = screen.getByPlaceholderText("50 123 45 67");
    const passwordInput = screen.getByPlaceholderText("••••••");
    const submitButton = screen.getByRole("button", { name: /daxil ol/i });

    // PhoneInput-un `!h-[52px]` override-i daxili <input>-də deyil, sabit
    // "+994" prefiksini əhatə edən xarici wrapper `<div>`-dədir.
    expect(phoneInput.parentElement?.className).toContain("52px");
    expect(passwordInput.className).toContain("52px");
    expect(submitButton.className).toContain("min-h-[52px]");
  });

  it("'Hesabı yadda saxla' checkbox defolt olaraq AÇIQDIR (bazar istifadəçisi üçün rahatlıq)", () => {
    render(<LoginPage />);

    const checkbox = screen.getByRole("checkbox", { name: /hesabı yadda saxla/i });
    expect(checkbox).toBeChecked();
    expect(
      screen.getByText("Bu cihazda 30 gün yadda qalacaq"),
    ).toBeInTheDocument();
  });

  it("göz ikonu şifrəni göstərir/gizlədir və aria-label vəziyyətə görə dəyişir", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText("••••••");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: "Şifrəni göstər" });
    await user.click(toggle);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Şifrəni gizlət" }),
    ).toBeInTheDocument();
  });

  it("boş sahələrlə submit ediləndə validasiya xətaları göstərilir və login çağırılmır", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /daxil ol/i }));

    expect(
      await screen.findByText("Telefon nömrəsi mütləqdir"),
    ).toBeInTheDocument();
    expect(screen.getByText("Şifrə mütləqdir")).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  // FE#188 — PhoneInput ilə natamam nömrə (9 yerli rəqəmdən az) submit edilməsin.
  it("natamam telefon nömrəsi ilə submit ediləndə 'Nömrəni tam yazın' xətası göstərilir, login çağırılmır", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("50 123 45 67"), "5011");
    await user.type(screen.getByPlaceholderText("••••••"), "demo123");
    await user.click(screen.getByRole("button", { name: /daxil ol/i }));

    expect(await screen.findByText("Nömrəni tam yazın")).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it("uğurlu girişdə (rememberMe AÇIQ) auth store yenilənir, sessiya localStorage-a yazılır və dashboard-a yönləndirilir", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      token: "tok_1",
      user: { id: "u1", name: "Test İstifadəçi", phone: "0501112233", role: "sahib" },
    });

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("50 123 45 67"), "501112233");
    await user.type(screen.getByPlaceholderText("••••••"), "demo123");
    // Checkbox defolt açıqdır — toxunmadan submit edirik.
    await user.click(screen.getByRole("button", { name: /daxil ol/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().user?.id).toBe("u1");
    });
    expect(authApi.login).toHaveBeenCalledWith("994501112233", "demo123", true);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/panel" });
    // AC — "yadda saxla" AÇIQ: sessiya localStorage-dadır (brauzer bağlanıb-açılsa da qalır).
    expect(localStorage.getItem("sederek-auth")).toContain("tok_1");
    expect(sessionStorage.getItem("sederek-auth")).toBeNull();
  });

  it("'Hesabı yadda saxla' SÖNÜK olanda sessiya sessionStorage-a yazılır (localStorage-da qalmır)", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      token: "tok_2",
      user: { id: "u2", name: "Test İstifadəçi 2", phone: "0501112233", role: "sahib" },
    });

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("50 123 45 67"), "501112233");
    await user.type(screen.getByPlaceholderText("••••••"), "demo123");
    await user.click(screen.getByRole("checkbox", { name: /hesabı yadda saxla/i }));
    await user.click(screen.getByRole("button", { name: /daxil ol/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().user?.id).toBe("u2");
    });
    expect(authApi.login).toHaveBeenCalledWith("994501112233", "demo123", false);
    // AC — "yadda saxla" SÖNÜK: brauzer tam bağlananda sessionStorage silinir, login təkrar tələb olunur.
    expect(sessionStorage.getItem("sederek-auth")).toContain("tok_2");
    expect(localStorage.getItem("sederek-auth")).toBeNull();
  });

  it("API xətasında InlineError bloku ilə server xəta mesajı göstərilir və yönləndirmə baş vermir", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError("Telefon və ya şifrə yanlışdır", "unauthorized", 401),
    );

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("50 123 45 67"), "501112233");
    await user.type(screen.getByPlaceholderText("••••••"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /daxil ol/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Telefon və ya şifrə yanlışdır");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("qeydiyyat və ana səhifə keçidləri düzgün ünvanlara işarə edir", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("link", { name: /yeni mağaza qeydiyyatı/i }),
    ).toHaveAttribute("href", "/qeydiyyat");
    expect(screen.getByRole("link", { name: /ana səhifə/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
