import { beforeEach, describe, expect, it } from "vitest";
import { setRememberMe, useAuthStore } from "./store";

const AUTH_KEY = "sederek-auth";

/**
 * FE#187 — "Hesabı yadda saxla" checkbox-ının persist mexanizmi.
 *
 * `setRememberMe(true)` → sonrakı `login()` localStorage-a yazır (brauzer
 * bağlanıb-açılsa da sessiya qalır — BE#45 30 günlük token).
 * `setRememberMe(false)` → sessionStorage-a yazır (brauzer TAM bağlananda
 * sessionStorage avtomatik silinir — bu, brauzerin öz davranışıdır, burada
 * yalnız "login zamanı DOĞRU yaddaşa yazılır" yoxlanılır).
 */
describe("auth store — dinamik rememberMe storage", () => {
  const user = { id: "u1", name: "Test", phone: "0501112233", role: "sahib" as const };

  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
    localStorage.clear();
    sessionStorage.clear();
  });

  it("rememberMe=true → sessiya localStorage-da saxlanılır, sessionStorage təmiz qalır", () => {
    setRememberMe(true);
    useAuthStore.getState().login(user, "tok_local");

    expect(localStorage.getItem(AUTH_KEY)).toContain("tok_local");
    expect(sessionStorage.getItem(AUTH_KEY)).toBeNull();
  });

  it("rememberMe=false → sessiya sessionStorage-da saxlanılır, localStorage-da qalmır", () => {
    setRememberMe(false);
    useAuthStore.getState().login(user, "tok_session");

    expect(sessionStorage.getItem(AUTH_KEY)).toContain("tok_session");
    expect(localStorage.getItem(AUTH_KEY)).toBeNull();
  });

  it("əvvəlki AÇIQ sessiyadan sonra SÖNÜK seçimə keçəndə localStorage-dakı köhnə iz təmizlənir", () => {
    setRememberMe(true);
    useAuthStore.getState().login(user, "tok_old");
    expect(localStorage.getItem(AUTH_KEY)).toContain("tok_old");

    // İstifadəçi çıxış edib checkbox-ı söndürərək yenidən daxil olur.
    setRememberMe(false);
    useAuthStore.getState().login(user, "tok_new");

    expect(localStorage.getItem(AUTH_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_KEY)).toContain("tok_new");
  });

  it("bayraq yoxdursa (ilk ziyarət) defolt localStorage istifadə olunur", () => {
    useAuthStore.getState().login(user, "tok_default");

    expect(localStorage.getItem(AUTH_KEY)).toContain("tok_default");
    expect(sessionStorage.getItem(AUTH_KEY)).toBeNull();
  });
});
