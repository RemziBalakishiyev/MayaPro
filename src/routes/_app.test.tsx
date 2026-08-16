import { describe, expect, it, beforeEach } from "vitest";
import { isRedirect } from "@tanstack/react-router";
import { Route } from "./_app";
import { useAuthStore } from "@/features/auth/store";

/**
 * FE#183 (AC-9/AC-10/TC-10/TC-11) — `/_app` (mağaza interfeysi) guard-ı:
 * - istifadəçi yoxdursa `/login`-ə
 * - `platform_admin` rolundadırsa `/admin`-ə yönləndirir (mağaza interfeysinə
 *   ümumiyyətlə giriş vermir).
 */
describe("/_app beforeLoad guard", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  const runBeforeLoad = () =>
    (Route.options.beforeLoad as () => void)();

  it("istifadəçi yoxdursa /login-ə yönləndirir", () => {
    let caught: unknown;
    try {
      runBeforeLoad();
    } catch (e) {
      caught = e;
    }
    expect(isRedirect(caught)).toBe(true);
    expect((caught as { options: { to: string } }).options.to).toBe("/login");
  });

  it("platform_admin rolu /admin-ə yönləndirilir, mağaza interfeysi render olunmur", () => {
    useAuthStore.setState({
      user: { id: "pa1", name: "Admin", role: "platform_admin" },
      token: "tok",
    });
    let caught: unknown;
    try {
      runBeforeLoad();
    } catch (e) {
      caught = e;
    }
    expect(isRedirect(caught)).toBe(true);
    expect((caught as { options: { to: string } }).options.to).toBe("/admin");
  });

  it("adi mağaza rolu (sahib) heç bir yönləndirmə almadan davam edir", () => {
    useAuthStore.setState({
      user: { id: "u1", name: "Sahib", role: "sahib" },
      token: "tok",
    });
    expect(() => runBeforeLoad()).not.toThrow();
  });
});
