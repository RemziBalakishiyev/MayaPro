/**
 * Açılışda saxlanılmış sessiyanın serverlə uzlaşdırılması.
 *
 * `sederek-auth` (localStorage) yaddaşındakı `user.role` bütün marşrut
 * guard-larını idarə edir: `/admin` yalnız `platform_admin`-ə açılır, mağaza
 * səhifələri isə yalnız mağaza rollarına. Bu dəyər bir dəfə yazılandan sonra
 * heç vaxt yoxlanılmırdı, ona görə köhnəlmiş rol istifadəçini davamlı olaraq
 * səhv interfeysdə saxlayırdı — məsələn brauzerdə backend bağlanmamış (mock)
 * buraxılışdan qalan `sahib` sessiyası ilə platforma admini mağaza panelini
 * görür və login səhifəsinə də qayıda bilmir (login guard-ı onu geri atır).
 *
 * Ona görə token varsa profil `GET /api/auth/me` ilə yenilənir və rol həmişə
 * serverdən gələn dəyər olur. Etibarsız token (401) sessiyanı təmizləyir;
 * müvəqqəti şəbəkə/server xətası isə sessiyaya toxunmur.
 */
import { authApi } from "./api";
import { useAuthStore } from "./store";
import { ApiError, USE_MOCK } from "@/lib/api-client";

/**
 * Saxlanılmış sessiyanı yoxlayır.
 *
 * @returns Profil dəyişdisə (rol/ad yeniləndi və ya sessiya təmizləndi) `true` —
 * bu halda çağıran tərəf router-i yenidən qiymətləndirməlidir.
 */
export async function verifyStoredSession(): Promise<boolean> {
  const { token, user, login, logout } = useAuthStore.getState();
  if (USE_MOCK || !token) return false;

  try {
    const fresh = await authApi.me();
    const unchanged =
      user !== null &&
      fresh.id === user.id &&
      fresh.role === user.role &&
      fresh.name === user.name;
    if (unchanged) return false;

    login(fresh, token);
    return true;
  } catch (e) {
    // 401-də api-client onsuz da logout edib /login-ə yönləndirir; burada
    // yalnız store-un təmiz qaldığına zəmanət veririk.
    if (e instanceof ApiError && e.status === 401) {
      logout();
      return true;
    }
    // 500 / şəbəkə xətası: server müvəqqəti əlçatmazdır, sessiyanı silmirik.
    return false;
  }
}
