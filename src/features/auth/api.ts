/** Auth API — real login (mock rejimdə demo giriş). */
import { apiClient, USE_MOCK } from "@/lib/api-client";
import { uid } from "@/lib/format";
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
};
