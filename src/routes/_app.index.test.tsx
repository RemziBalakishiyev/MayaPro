import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentType } from "react";

/**
 * FE#127 (TC-32): Ana səhifə (Dashboard) şəbəkə xətası ilə uğursuz olduqda
 * sonsuz `<Spinner />` ƏVƏZİNƏ `InlineError` + "Yenidən cəhd et"
 * göstərilməlidir.
 */
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );
  return {
    ...actual,
    // Dashboard yalnız <Link> istifadə edir, router hook-ları çağırmır —
    // real router konteksti olmadan sadə <a> kimi render edilə bilər.
    Link: ({
      children,
      to,
      ...props
    }: { children?: React.ReactNode; to?: string } & Record<
      string,
      unknown
    >) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock("@/features/reports/queries", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/reports/queries")
  >("@/features/reports/queries");
  return { ...actual, useDashboardStats: vi.fn() };
});

import { Route } from "./_app.index";
import { useDashboardStats } from "@/features/reports/queries";

const mockUseDashboardStats = vi.mocked(useDashboardStats);
const DashboardPage = Route.options.component as ComponentType;

describe("Dashboard — şəbəkə xətası (FE#127)", () => {
  beforeEach(() => {
    mockUseDashboardStats.mockReset();
  });

  it("isError=true olduqda InlineError göstərir, sonsuz spinner YOX", () => {
    const refetch = vi.fn();
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as never);

    render(<DashboardPage />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Dashboard yüklənmədi")).toBeInTheDocument();
    expect(screen.queryByText("Bugünkü satış")).not.toBeInTheDocument();
  });

  it("'Yenidən cəhd et' düyməsinə klik refetch-i çağırır", async () => {
    const refetch = vi.fn();
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as never);
    const user = userEvent.setup();

    render(<DashboardPage />);
    await user.click(
      screen.getByRole("button", { name: /yenidən cəhd et/i }),
    );

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("isLoading=true olduqda spinner göstərir, alert YOX (regressiya)", () => {
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<DashboardPage />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
