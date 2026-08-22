import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyStoredSession } from "./session";
import { authApi } from "./api";
import { useAuthStore } from "./store";
import { ApiError } from "@/lib/api-client";

vi.mock("./api", () => ({
  authApi: { me: vi.fn() },
}));

// USE_MOCK real backend URL-i olmayan test mühitində `true` olur — bu testlər
// məhz real backend davranışını yoxlayır.
vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  USE_MOCK: false,
}));

/**
 * Saxlanılmış sessiyanın serverlə uzlaşdırılması: localStorage-dakı rol
 * marşrut guard-larını idarə etdiyi üçün köhnəlmiş rol istifadəçini səhv
 * interfeysdə kilidləyir (platforma admini mağaza panelində qalır).
 */
describe("verifyStoredSession", () => {
  beforeEach(() => {
    vi.mocked(authApi.me).mockReset();
    useAuthStore.setState({ user: null, token: null });
  });

  it("token yoxdursa serverə müraciət etmir", async () => {
    const changed = await verifyStoredSession();

    expect(changed).toBe(false);
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it("köhnəlmiş rolu serverdən gələn rolla əvəz edir", async () => {
    useAuthStore.setState({
      user: { id: "u1", name: "Admin", phone: "0500000000", role: "sahib" },
      token: "tok",
    });
    vi.mocked(authApi.me).mockResolvedValue({
      id: "u1",
      name: "Admin",
      phone: "0500000000",
      role: "platform_admin",
    });

    const changed = await verifyStoredSession();

    expect(changed).toBe(true);
    expect(useAuthStore.getState().user?.role).toBe("platform_admin");
    expect(useAuthStore.getState().token).toBe("tok");
  });

  it("profil eynidirsə store-a toxunmur", async () => {
    const user = {
      id: "u1",
      name: "Sahib",
      phone: "0501112233",
      role: "sahib" as const,
    };
    useAuthStore.setState({ user, token: "tok" });
    vi.mocked(authApi.me).mockResolvedValue({ ...user });

    const changed = await verifyStoredSession();

    expect(changed).toBe(false);
    expect(useAuthStore.getState().user).toBe(user);
  });

  it("401-də sessiyanı təmizləyir", async () => {
    useAuthStore.setState({
      user: { id: "u1", name: "Sahib", phone: "050", role: "sahib" },
      token: "mock_tok",
    });
    vi.mocked(authApi.me).mockRejectedValue(
      new ApiError("Sessiya bitib", "Auth.Unauthorized", 401),
    );

    const changed = await verifyStoredSession();

    expect(changed).toBe(true);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("müvəqqəti server xətası (500) sessiyanı silmir", async () => {
    useAuthStore.setState({
      user: { id: "u1", name: "Sahib", phone: "050", role: "sahib" },
      token: "tok",
    });
    vi.mocked(authApi.me).mockRejectedValue(
      new ApiError("Gözlənilməz xəta baş verdi", "Server.Error", 500),
    );

    const changed = await verifyStoredSession();

    expect(changed).toBe(false);
    expect(useAuthStore.getState().token).toBe("tok");
  });
});
