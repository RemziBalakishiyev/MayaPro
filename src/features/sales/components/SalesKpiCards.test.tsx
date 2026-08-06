import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SalesKpiCards } from "./SalesKpiCards";
import { useSalesKpi } from "@/features/reports/queries";

vi.mock("@/features/reports/queries", () => ({
  useSalesKpi: vi.fn(),
}));

const mockUseSalesKpi = vi.mocked(useSalesKpi);

const baseData = {
  salesCount: 12,
  totalRevenue: 2400,
  totalProfit: 620,
  avgSale: 200,
  unknownProfitSalesCount: 0,
  unknownProfitAmount: 0,
  byPayment: [
    { type: "Nağd" as const, profit: 300 },
    { type: "Kart" as const, profit: 220 },
    { type: "Nisyə" as const, profit: 100 },
  ],
};

/** FE#71 (AC-6/AC-7) — Satış jurnalı KPI kompozisiyası. */
describe("SalesKpiCards", () => {
  beforeEach(() => {
    mockUseSalesKpi.mockReset();
  });

  it("AC-6 — birinci səviyyə panel dəqiq 4 göstərici göstərir: Satış sayı, Ümumi satış, Ümumi qazanc, Orta satış", () => {
    mockUseSalesKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<SalesKpiCards range={{}} />);

    expect(screen.getByText("Satış sayı")).toBeInTheDocument();
    expect(screen.getByText("Ümumi satış")).toBeInTheDocument();
    expect(screen.getByText("Ümumi qazanc")).toBeInTheDocument();
    expect(screen.getByText("Orta satış")).toBeInTheDocument();
  });

  it("AC-6 — 4 göstərici TƏK birləşik panel (StatCluster) daxilindədir, ayrıca kart yoxdur", () => {
    mockUseSalesKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    const { container } = render(<SalesKpiCards range={{}} />);

    // StatCluster tək bir `rounded-card` konteynerdir — "Orta satış" da
    // eyni konteynerin daxilindədir (əvvəlki ayrıca `KpiCard` YOXDUR).
    const cluster = screen.getByText("Satış sayı").closest(".rounded-card");
    expect(cluster).not.toBeNull();
    expect(within(cluster as HTMLElement).getByText("Orta satış")).toBeInTheDocument();
    // Səhifədə yalnız BİR `.rounded-card` panel olmalıdır (birinci səviyyə).
    expect(container.querySelectorAll(".rounded-card").length).toBe(1);
  });

  it("AC-7 — Nağd/Kart/Nisyə qazanc bölgüsü ikinci dərəcəli, kiçik tipoqrafiyalı ayrıca paneldədir", () => {
    mockUseSalesKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<SalesKpiCards range={{}} />);

    expect(screen.getByText("Nağd qazanc")).toBeInTheDocument();
    expect(screen.getByText("Kart qazanc")).toBeInTheDocument();
    expect(screen.getByText("Nisyə qazanc")).toBeInTheDocument();

    // Əsas paneldəki "Ümumi qazanc" böyük tipoqrafiya (text-xl/2xl) istifadə
    // edir, ikinci dərəcəli "Nağd qazanc" isə kiçik (text-sm) — ölçü fərqi
    // vizual ikinci dərəcəliliyi göstərir. (`fmtMoney` qırılmaz boşluq
    //   işlədir — normalize olunmuş DOM mətni ilə tam üst-üstə düşməmə
    // riskinə görə regex istifadə olunur.)
    const mainValue = screen.getByText(/^620\.00/);
    expect(mainValue.className).toMatch(/text-xl/);
    const cashValue = screen.getByText(/^300\.00/);
    expect(cashValue.className).toMatch(/text-sm/);
    expect(cashValue.className).not.toMatch(/text-xl/);
  });

  it("AC-18 — naməlum qazanclı satışlar barədə xəbərdarlıq Ümumi qazanc altında görünür", () => {
    mockUseSalesKpi.mockReturnValue({
      data: { ...baseData, unknownProfitSalesCount: 2, unknownProfitAmount: 50 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<SalesKpiCards range={{}} />);
    expect(screen.getByText(/2 satış naməlum/)).toBeInTheDocument();
  });

  it("xəta halında hər iki panel 'Yüklənmədi' göstərir və 'Yenidən' refetch-i çağırır", async () => {
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

  it("yüklənmə zamanı hər iki panel skeleton göstərir, xam '620.00 ₼' YOX", () => {
    mockUseSalesKpi.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<SalesKpiCards range={{}} />);
    expect(screen.getByText("Satış sayı")).toBeInTheDocument();
    expect(screen.getByText("Nağd qazanc")).toBeInTheDocument();
    expect(screen.queryByText(/620\.00/)).not.toBeInTheDocument();
  });
});
