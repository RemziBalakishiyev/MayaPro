import { describe, expect, it, beforeEach } from "vitest";
import { isRedirect } from "@tanstack/react-router";
import { Route } from "./admin";
import { useAuthStore } from "@/features/auth/store";

/**
 * FE#183 (AC-8/AC-9/TC-9/TC-10) — `/admin` guard-ı:
 * - istifadəçi yoxdursa `/login`-ə
 * - adi mağaza rolu (sahib/menecer/satici) `/`-ə (adi guard sonra /login-ə aparır)
 * - `platform_admin` heç bir yönləndirmə almadan davam edir (panel görünür)
 */
describe("/admin beforeLoad guard", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  const runBeforeLoad = () => (Route.options.beforeLoad as () => void)();

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

  it("adi mağaza rolu (sahib) /-ə yönləndirilir, admin paneli render olunmur", () => {
    useAuthStore.setState({
      user: { id: "u1", name: "Sahib", role: "sahib" },
      token: "tok",
    });
    let caught: unknown;
    try {
      runBeforeLoad();
    } catch (e) {
      caught = e;
    }
    expect(isRedirect(caught)).toBe(true);
    expect((caught as { options: { to: string } }).options.to).toBe("/panel");
  });

  it("platform_admin rolu heç bir yönləndirmə olmadan davam edir", () => {
    useAuthStore.setState({
      user: { id: "pa1", name: "Admin", role: "platform_admin" },
      token: "tok",
    });
    expect(() => runBeforeLoad()).not.toThrow();
  });
});
