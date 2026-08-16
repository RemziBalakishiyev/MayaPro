/** Auth API — real login (mock rejimdə demo giriş). */
import { apiClient, USE_MOCK } from "@/lib/api-client";
import { uid } from "@/lib/format";
import { mockRegisterPendingTenant } from "@/features/admin/api";
import type { AuthUser } from "./store";
import type { Role } from "@/types";

interface LoginResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
    role: Role;
  };
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

const toAuthUser = (u: LoginResponse["user"]): AuthUser => ({
  id: u.id,
  name: u.fullName,
  phone: u.phone,
  role: u.role,
});

/** FE#183 — POST /api/auth/register body-si (BE#36 `RegisterTenantCommand`). */
export interface RegisterTenantInput {
  storeName: string;
  ownerName: string;
  phone: string;
  password: string;
}

/** BE#36 `RegistrationResultDto` — token verilmir, mağaza `PendingApproval`-dədir. */
export interface RegisterTenantResult {
  tenantId: string;
  storeName: string;
  status: string;
  message: string;
}

const MOCK_PENDING_MESSAGE =
  "Qeydiyyatınız qəbul edildi. Hesabınız təsdiq gözləyir";

export const authApi = {
  /** Telefon + şifrə ilə giriş. Mock rejimdə istənilən dəyər qəbul olunur. */
  async login(phone: string, password: string): Promise<LoginResult> {
    if (USE_MOCK) {
      return {
        token: `mock_${uid("tok")}`,
        user: {
          id: uid("user"),
          name: phone.trim() || "İstifadəçi",
          phone: phone.trim(),
          role: "sahib",
        },
      };
    }
    const res = await apiClient.post<LoginResponse>("/api/auth/login", {
      phone,
      password,
    });
    return { token: res.token, user: toAuthUser(res.user) };
  },

  /** Cari istifadəçi (token etibarlıdırmı yoxlaması üçün). */
  async me(): Promise<AuthUser> {
    const u = await apiClient.get<LoginResponse["user"]>("/api/auth/me");
    return toAuthUser(u);
  },

  /**
   * FE#183 — anonim yeni mağaza qeydiyyatı (BE#36 `POST /api/auth/register`).
   * Uğurda token verilmir: mağaza `PendingApproval` statusundadır, admin
   * təsdiqindən əvvəl daxil olmaq olmaz.
   */
  async register(input: RegisterTenantInput): Promise<RegisterTenantResult> {
    if (USE_MOCK) {
      // Admin panelinin mock siyahısında dərhal "Gözləyir" kimi görünsün
      // (TC-14 uçdan-uca ssenarisi backend olmadan da yoxlana bilsin).
      mockRegisterPendingTenant(
        input.storeName.trim(),
        input.ownerName.trim(),
        input.phone.trim(),
      );
      return {
        tenantId: uid("tenant"),
        storeName: input.storeName.trim(),
        status: "PendingApproval",
        message: MOCK_PENDING_MESSAGE,
      };
    }
    return apiClient.post<RegisterTenantResult>("/api/auth/register", {
      storeName: input.storeName.trim(),
      ownerName: input.ownerName.trim(),
      phone: input.phone.trim(),
      password: input.password,
    });
  },
};
