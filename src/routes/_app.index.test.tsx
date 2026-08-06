import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentType, ReactNode } from "react";

/**
 * FE#142 (TC-32): Ana səhifə (Dashboard) şəbəkə xətası ilə uğursuz olduqda
 * sonsuz `<Spinner />` ƏVƏZİNƏ `InlineError` + "Yenidən" göstərilməlidir.
 * Əvvəl uğurla yüklənmiş data varkən arxa-fon refetch xətası isə mövcud
 * Dashboard-u İTİRMƏMƏLİDİR — yalnız kiçik xəbərdarlıq zolağı göstərilir.
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
    }: { children?: ReactNode; to?: string } & Record<string, unknown>) => (
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

const dashboardData = {
  expectedCash: 100,
  openingCash: 50,
  todayCash: 30,
  todayExpenses: 10,
  paperProfit: 20,
  todayCredit: 5,
  todayTotal: 100,
  todayProfit: 20,
  unknownProfitSalesCount: 0,
  unknownProfitAmount: 0,
  todayCard: 10,
  stockValue: 1000,
  receivables: 200,
  payables: 100,
  daily: [],
  monthly: [],
  topProducts: [],
  lowStock: [],
  frozen: [],
  recentSales: [],
  recentSaleCustomer: () => null,
  recentPayments: [],
  cusName: () => "—",
  empName: () => "—",
  expByCat: [],
};

describe("Dashboard — şəbəkə xətası (FE#142)", () => {
  beforeEach(() => {
    mockUseDashboardStats.mockReset();
  });

  it("isError=true, heç vaxt yüklənməyib → InlineError göstərir, sonsuz spinner YOX", () => {
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

  it("'Yenidən' düyməsinə klik refetch-i çağırır", async () => {
    const refetch = vi.fn();
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as never);
    const user = userEvent.setup();

    render(<DashboardPage />);
    await user.click(screen.getByRole("button", { name: /yenidən/i }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("isLoading=true olduqda skeleton göstərir, alert YOX (regressiya)", () => {
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<DashboardPage />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("uğurla yüklənmiş data varkən arxa-fon refetch xətası → Dashboard itmir, tam InlineError göstərilmir (FE#142)", () => {
    const refetch = vi.fn();
    mockUseDashboardStats.mockReturnValue({
      data: dashboardData,
      isLoading: false,
      isError: true,
      refetch,
    } as never);

    render(<DashboardPage />);

    expect(screen.queryByText("Dashboard yüklənmədi")).not.toBeInTheDocument();
    expect(screen.getByText("Bugünkü satış")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmədi|köhnəlmiş/i,
    );
  });

  it("isError=false, data mövcud → normal Dashboard, alert YOX (regressiya)", () => {
    mockUseDashboardStats.mockReturnValue({
      data: dashboardData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<DashboardPage />);

    expect(screen.getByText("Bugünkü satış")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
