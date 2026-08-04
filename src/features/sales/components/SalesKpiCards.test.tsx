import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SalesKpiCards } from "./SalesKpiCards";
import { useSalesKpi } from "@/features/reports/queries";

vi.mock("@/features/reports/queries", () => ({
  useSalesKpi: vi.fn(),
}));

const mockUseSalesKpi = vi.mocked(useSalesKpi);

const baseData = {
  salesCount: 42,
  totalRevenue: 50230,
  totalProfit: 39115,
  unknownProfitSalesCount: 0,
  unknownProfitAmount: 0,
  byPayment: [
    { type: "Nağd" as const, revenue: 20000, profit: 18157 },
    { type: "Kart" as const, revenue: 22000, profit: 20356 },
    { type: "Nisyə" as const, revenue: 8230, profit: 602 },
  ],
  avgSale: 1196,
};

/** FE#62 — Satış səhifəsi KPI kompozisiyası: SATIŞ + QAZANC (cəm-hissə hekayəsi). */
describe("SalesKpiCards", () => {
  beforeEach(() => {
    mockUseSalesKpi.mockReset();
  });

  it("SATIŞ paneli: Satış sayı · Ümumi satış · Orta satış eyni panel daxilində görünür", () => {
    mockUseSalesKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<SalesKpiCards range={{}} />);
    expect(screen.getByText("Satış sayı")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Ümumi satış")).toBeInTheDocument();
    expect(screen.getByText("Orta satış")).toBeInTheDocument();
  });

  it("QAZANC paneli: Ümumi qazanc panelin ulduzu kimi görünür (ən böyük rəqəm)", () => {
    mockUseSalesKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<SalesKpiCards range={{}} />);
    expect(screen.getByText("Ümumi qazanc")).toBeInTheDocument();
    // fmtMoney formats amounts with narrow no-break space + ₼
    expect(screen.getByText(/39,115\.00/)).toBeInTheDocument();
  });

  it("Nağd/Kart/Nisyə bölgüsü hər biri öz məbləğilə görünür", () => {
    mockUseSalesKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<SalesKpiCards range={{}} />);
    expect(screen.getByText("Nağd")).toBeInTheDocument();
    expect(screen.getByText("Kart")).toBeInTheDocument();
    expect(screen.getByText("Nisyə")).toBeInTheDocument();
    expect(screen.getByText(/18,157\.00/)).toBeInTheDocument();
    expect(screen.getByText(/20,356\.00/)).toBeInTheDocument();
    expect(screen.getByText(/602\.00/)).toBeInTheDocument();
  });

  it("cəm-hissə əlaqəsi: mini-bar proporsiyaları Nağd+Kart+Nisyə cəminin ümumi qazanca bərabər olmasına görə hesablanır", () => {
    mockUseSalesKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    const { container } = render(<SalesKpiCards range={{}} />);
    const bars = container.querySelectorAll<HTMLDivElement>(
      "[style*='width']",
    );
    expect(bars.length).toBe(3);
    const pct = (v: number) => (v / baseData.totalProfit) * 100;
    const widths = Array.from(bars).map((b) =>
      parseFloat(b.style.width.replace("%", "")),
    );
    expect(widths[0]).toBeCloseTo(pct(18157), 1);
    expect(widths[1]).toBeCloseTo(pct(20356), 1);
    expect(widths[2]).toBeCloseTo(pct(602), 1);
    // Cəm-hissə: bütün faizlərin cəmi 100%-ə (təxminən) bərabərdir.
    expect(widths.reduce((s, w) => s + w, 0)).toBeCloseTo(100, 1);
  });

  it("naməlum qazanclı satış varsa panel altında boz qeyd sətri görünür", () => {
    mockUseSalesKpi.mockReturnValue({
      data: { ...baseData, unknownProfitSalesCount: 3, unknownProfitAmount: 450 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<SalesKpiCards range={{}} />);
    expect(
      screen.getByText(/3 satış naməlum/),
    ).toBeInTheDocument();
  });

  it("naməlum qazanclı satış yoxdursa qeyd sətri göstərilmir", () => {
    mockUseSalesKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<SalesKpiCards range={{}} />);
    expect(screen.queryByText(/satış naməlum/)).not.toBeInTheDocument();
  });

  it("xəta halında QAZANC paneli 'Yüklənmədi' göstərir və Yenidən onRetry çağırır", async () => {
    const refetch = vi.fn();
    const user = userEvent.setup();
    mockUseSalesKpi.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as never);
    render(<SalesKpiCards range={{}} />);
    const retryButtons = screen.getAllByRole("button", { name: /yenidən/i });
    expect(retryButtons.length).toBeGreaterThan(0);
    await user.click(retryButtons[0]);
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
