import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType, ReactNode } from "react";

/**
 * FE#183 (AC-4/AC-5/AC-6/TC-04/TC-05/TC-06) — `/hesab-bloklu` üç blok
 * səbəbini (`PendingApproval` / `Blocked` / `SubscriptionExpired`) düzgün
 * mesaj + admin əlaqə telefonu ilə göstərir.
 */
let mockSearch: { reason?: string; message?: string } = {};

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );
  return {
    ...actual,
    createFileRoute: () => (options: Record<string, unknown>) => ({
      options,
      useSearch: () => mockSearch,
    }),
    Link: ({ children, to, ...rest }: { children?: ReactNode; to?: string }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  };
});

import { Route } from "./hesab-bloklu";

const AccessBlockedPage = Route.options.component as ComponentType;

describe("/hesab-bloklu", () => {
  it("PendingApproval — 'Hesabınız təsdiq gözləyir' mesajı göstərir", () => {
    mockSearch = { reason: "PendingApproval" };
    render(<AccessBlockedPage />);
    expect(screen.getByText("Hesabınız təsdiq gözləyir")).toBeInTheDocument();
  });

  it("Blocked — 'Hesabınıza giriş bloklanıb' mesajı və admin telefonu göstərir", () => {
    mockSearch = {
      reason: "Blocked",
      message: "Abunəliyiniz bitib — əlaqə: 994501112233",
    };
    render(<AccessBlockedPage />);
    expect(screen.getByText("Hesabınıza giriş bloklanıb")).toBeInTheDocument();
    expect(screen.getByText(/Admin ilə əlaqə: 994501112233/)).toBeInTheDocument();
  });

  it("SubscriptionExpired — dəqiq mətn: 'Abunə müddətiniz bitib' + 'Ödənişdən sonra sistem avtomatik açılacaq.'", () => {
    mockSearch = { reason: "SubscriptionExpired" };
    render(<AccessBlockedPage />);
    expect(screen.getByText("Abunə müddətiniz bitib")).toBeInTheDocument();
    expect(
      screen.getByText("Ödənişdən sonra sistem avtomatik açılacaq."),
    ).toBeInTheDocument();
  });

  it("'Girişə qayıt' keçidi /login-ə aparır", () => {
    mockSearch = { reason: "Blocked" };
    render(<AccessBlockedPage />);
    const link = screen.getByRole("link", { name: /girişə qayıt/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
