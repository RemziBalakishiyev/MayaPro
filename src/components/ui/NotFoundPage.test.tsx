import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { NotFoundPage } from "./NotFoundPage";
import { useAuthStore } from "@/features/auth/store";

/**
 * FE#189 (bənd 1/4) — qlobal 404 kontekstə görə 3 variant göstərir:
 * admin bölməsi (`/admin/*`), daxil olmuş mağaza istifadəçisi (panel) və
 * daxil olmayan ziyarətçi (landing/public).
 */
let mockPathname = "/olmayan-sehife";
const mockHistoryBack = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>(
      "@tanstack/react-router",
    );
  return {
    ...actual,
    useLocation: () => ({ pathname: mockPathname }),
    useRouter: () => ({ history: { back: mockHistoryBack } }),
    Link: ({ children, to, ...rest }: { children?: ReactNode; to?: string }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  };
});

describe("NotFoundPage", () => {
  beforeEach(() => {
    mockPathname = "/olmayan-sehife";
    mockHistoryBack.mockClear();
    useAuthStore.setState({ user: null, token: null });
  });

  it("daxil olmayıb → landing variantı: [Ana səhifə] (/) və [Daxil ol] (/login)", () => {
    render(<NotFoundPage />);
    expect(screen.getByText("Bu səhifə tapılmadı")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ana səhifə" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Daxil ol" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("daxil olub (panel) → [Ana səhifəyə qayıt] (/panel) və [Geri qayıt]", async () => {
    useAuthStore.setState({
      user: { id: "u1", name: "Test", role: "sahib" },
      token: "tok",
    });
    render(<NotFoundPage />);
    expect(
      screen.getByRole("link", { name: "Ana səhifəyə qayıt" }),
    ).toHaveAttribute("href", "/panel");

    const backBtn = screen.getByRole("button", { name: "Geri qayıt" });
    backBtn.click();
    expect(mockHistoryBack).toHaveBeenCalledTimes(1);
  });

  it("/admin/* altında → admin dilində (Platforma Admin başlığı + [Admin panelinə qayıt])", () => {
    mockPathname = "/admin/olmayan-sehife";
    useAuthStore.setState({
      user: { id: "u2", name: "Admin", role: "platform_admin" },
      token: "tok",
    });
    render(<NotFoundPage />);
    expect(screen.getByText("Platforma Admin")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Admin panelinə qayıt" }),
    ).toHaveAttribute("href", "/admin");
  });
});
