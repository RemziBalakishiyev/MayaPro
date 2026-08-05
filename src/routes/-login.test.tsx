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
}));

vi.mock("@/features/auth/api", () => ({
  authApi: { login: vi.fn() },
}));

/**
 * FE#119 — login.tsx-də xam <input>/<button> DS `Input`/`Button`/`Field`
 * primitivlərinə köçürüldü (§1.6: heç bir kontrol 40px-dən kiçik olmamalıdır).
 * Bu testlər köçürmədən sonra da mövcud giriş funksionallığının
 * (validasiya, submit, server xətası, loading) qırılmadığını təsdiqləyir.
 */
describe("LoginPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.mocked(authApi.login).mockReset();
    useAuthStore.setState({ user: null, token: null });
  });

  it("DS primitivlərindən istifadə edir — telefon/şifrə input-ları və submit düyməsi ≥40px hündürlük tokeni (h-12 / min-h-[52px]) daşıyır", () => {
    render(<LoginPage />);

    const phoneInput = screen.getByPlaceholderText("0501112233");
    const passwordInput = screen.getByPlaceholderText("••••••");
    const submitButton = screen.getByRole("button", { name: /daxil ol/i });

    expect(phoneInput.className).toContain("h-12");
    expect(passwordInput.className).toContain("h-12");
    // FE#69-dan miras qalan `size="lg"` (min-h-[52px]) DS Button-un
    // defolt `md` (44px) ölçüsündən daha da böyük toxunma hədəfi verir.
    expect(submitButton.className).toContain("min-h-[52px]");
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

  it("uğurlu girişdə auth store yenilənir və dashboard-a yönləndirilir", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      token: "tok_1",
      user: { id: "u1", name: "Test İstifadəçi", phone: "0501112233", role: "sahib" },
    });

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("0501112233"), "0501112233");
    await user.type(screen.getByPlaceholderText("••••••"), "demo123");
    await user.click(screen.getByRole("button", { name: /daxil ol/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().user?.id).toBe("u1");
    });
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("API xətasında server xəta mesajı göstərilir və yönləndirmə baş vermir", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError("Telefon və ya şifrə yanlışdır", "unauthorized", 401),
    );

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("0501112233"), "0501112233");
    await user.type(screen.getByPlaceholderText("••••••"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /daxil ol/i }));

    expect(
      await screen.findByText("Telefon və ya şifrə yanlışdır"),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
