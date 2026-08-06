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
  return { ...actual, useDashboardStats: vi.fn(), useDebtsKpi: vi.fn() };
});

// FE#72 (② Diqqət bölməsi) — gün bağlanış statusu mövcud Gün Sonu sorğusundan
// gəlir. Real QueryClientProvider olmadığı üçün burada da mocklanır.
vi.mock("@/features/day-end/queries", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/day-end/queries")
  >("@/features/day-end/queries");
  return { ...actual, useTodayClosing: vi.fn() };
});

import { Route } from "./_app.index";
import { useDashboardStats, useDebtsKpi } from "@/features/reports/queries";
import { useTodayClosing } from "@/features/day-end/queries";

const mockUseDashboardStats = vi.mocked(useDashboardStats);
const mockUseDebtsKpi = vi.mocked(useDebtsKpi);
const mockUseTodayClosing = vi.mocked(useTodayClosing);
const DashboardPage = Route.options.component as ComponentType;

/** ② sorğuları — hər testdə fərqli davranış lazım olmadıqda bu defolt kifayətdir. */
const stubSecondaryQueries = () => {
  mockUseDebtsKpi.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  } as never);
  mockUseTodayClosing.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
    isSuccess: false,
  } as never);
};

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
    mockUseDebtsKpi.mockReset();
    mockUseTodayClosing.mockReset();
    stubSecondaryQueries();
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

/**
 * FE#72 — Ana səhifə iyerarxiyası: ① əsas icmal, ② "İndi nə etməliyəm?"
 * diqqət bölməsi, ③ ikinci dərəcəli detallar, chartların "kifayət qədər
 * data" gating-i.
 */
describe("Dashboard — iyerarxiya refactoru (FE#72)", () => {
  beforeEach(() => {
    mockUseDashboardStats.mockReset();
    mockUseDebtsKpi.mockReset();
    mockUseTodayClosing.mockReset();
    stubSecondaryQueries();
    mockUseDashboardStats.mockReturnValue({
      data: dashboardData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

  it("① əsas icmalda TƏK yerdə 'Kassada olmalı' göstərilir, köhnə iç-içə imza zolağı yoxdur", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Kassada olmalı")).toBeInTheDocument();
    expect(screen.getByText("Bugünkü real qazanc")).toBeInTheDocument();
    // Köhnə SignatureBand mətnləri artıq yoxdur (AC-1/AC-2)
    expect(screen.queryByText(/Real pul — kassada olmalı/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Kağız üzərində qazanc/i)).not.toBeInTheDocument();
  });

  it("'Bugünkü real qazanc' altında nisyə hissəsi sadə dildə izah olunur (AC-4)", () => {
    render(<DashboardPage />);

    expect(
      screen.getByText(/nisyə satdıqların hələ cibində deyil/i),
    ).toBeInTheDocument();
  });

  it("② diqqət bölməsi heç bir siqnal yoxdursa müsbət boş vəziyyət göstərir", () => {
    mockUseDashboardStats.mockReturnValue({
      data: { ...dashboardData, receivables: 0, payables: 0 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    mockUseTodayClosing.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isSuccess: false,
    } as never);

    render(<DashboardPage />);

    expect(screen.getByText("Diqqət tələb edən heç nə yoxdur")).toBeInTheDocument();
  });

  it("azalan mal sayı xəbərdarlığı Mallar səhifəsinə 'Azalır' filtri ilə keçiddir (AC-5)", () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        ...dashboardData,
        lowStock: [
          { id: "p1", name: "Çay", quantity: 2, minStock: 5, status: "Azalır" },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<DashboardPage />);

    const link = screen.getByText("1 malın stoku azalır").closest("a");
    expect(link).toHaveAttribute("href", "/mallar");
  });

  it("gün bağlanmayıbsa 'Bu gün hələ bağlanmayıb' xəbərdarlığı Gün Sonuna keçiddir", () => {
    mockUseTodayClosing.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
    } as never);

    render(<DashboardPage />);

    const link = screen.getByText("Bu gün hələ bağlanmayıb").closest("a");
    expect(link).toHaveAttribute("href", "/gun-sonu");
  });

  it("gün bağlanıbsa (fərq 0) 'Gün bağlanıb' + 'Kassa düz gəlib' göstərir", () => {
    mockUseTodayClosing.mockReturnValue({
      data: {
        id: "c1",
        date: "2026-08-06",
        openingCash: 0,
        cashSales: 0,
        cardSales: 0,
        creditSales: 0,
        expenses: 0,
        expectedCash: 0,
        actualCash: 0,
        difference: 0,
      },
      isLoading: false,
      isError: false,
      isSuccess: true,
    } as never);

    render(<DashboardPage />);

    expect(screen.getByText("Gün bağlanıb")).toBeInTheDocument();
    expect(screen.getByText("Kassa düz gəlib")).toBeInTheDocument();
  });

  it("③ ikinci dərəcəli detallarda Nağd/Kart/Nisyə satış və anbar/borc göstəriciləri qorunur (data itmir)", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Nağd satış")).toBeInTheDocument();
    expect(screen.getByText("Kart satış")).toBeInTheDocument();
    expect(screen.getByText("Nisyə satış")).toBeInTheDocument();
    expect(screen.getByText("Anbardakı malın dəyəri")).toBeInTheDocument();
    expect(screen.getByText("Mənə borcu olanlar")).toBeInTheDocument();
    expect(screen.getByText("Mənim borcum")).toBeInTheDocument();
  });

  it("az/boş data ilə chartlar əvəzinə aydın boş vəziyyət göstərir (AC-6/AC-7)", () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        ...dashboardData,
        daily: [
          { date: "01.08", satis: 10, qazanc: 2 },
          { date: "02.08", satis: 0, qazanc: 0 },
        ],
        monthly: [{ month: "08.26", qazanc: 5 }],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<DashboardPage />);

    expect(
      screen.getAllByText("Hələ kifayət qədər məlumat yoxdur").length,
    ).toBe(2);
  });

  it("kifayət qədər data olduqda chart göstərilir, boş vəziyyət göstərilmir", () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        ...dashboardData,
        daily: [
          { date: "01.08", satis: 10, qazanc: 2 },
          { date: "02.08", satis: 5, qazanc: 1 },
          { date: "03.08", satis: 8, qazanc: 3 },
        ],
        monthly: [
          { month: "07.26", qazanc: 5 },
          { month: "08.26", qazanc: 8 },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<DashboardPage />);

    expect(
      screen.queryByText("Hələ kifayət qədər məlumat yoxdur"),
    ).not.toBeInTheDocument();
  });
});
