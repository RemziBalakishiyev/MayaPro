import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DebtsKpiCards } from "./DebtsKpiCards";
import { useDebtsKpi } from "@/features/reports/queries";

vi.mock("@/features/reports/queries", () => ({
  useDebtsKpi: vi.fn(),
}));

const mockUseDebtsKpi = vi.mocked(useDebtsKpi);

const baseData = {
  totalOutstanding: 4200,
  debtorCount: 7,
  topDebtor: { name: "Elvin Məmmədov", amount: 1500 },
  periodNewDebt: 900,
  periodCollected: 350,
  oldestDebtDays: 42,
};

/** FE#61 — Nisyə Borclar səhifəsi KPI kompozisiyası. */
describe("DebtsKpiCards", () => {
  beforeEach(() => {
    mockUseDebtsKpi.mockReset();
  });

  it("dövr filtrinə bağlı sətri göstərir: 'Bu dövrdə: ... borc yarandı · ... ödəniş yığıldı'", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<DebtsKpiCards range={{}} />);
    expect(screen.getByText(/Bu dövrdə:/)).toBeInTheDocument();
    expect(screen.getByText(/borc yarandı/)).toBeInTheDocument();
    expect(screen.getByText(/ödəniş yığıldı/)).toBeInTheDocument();
  });

  it("Ümumi qalıq / Borclu sayı / Ən köhnə borc günü StatCluster-də görünür", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<DebtsKpiCards range={{}} />);
    expect(screen.getByText("Ümumi qalıq")).toBeInTheDocument();
    expect(screen.getByText("Borclu sayı")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Ən köhnə borc günü")).toBeInTheDocument();
    expect(screen.getByText("42 gün")).toBeInTheDocument();
  });

  it("Ən böyük borclu kartı ad + məbləği göstərir", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<DebtsKpiCards range={{}} />);
    expect(screen.getByText("Ən böyük borclu")).toBeInTheDocument();
    expect(screen.getByText("Elvin Məmmədov")).toBeInTheDocument();
  });

  it("borclu yoxdursa 'Borclu yoxdur' göstərir", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: { ...baseData, topDebtor: null },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<DebtsKpiCards range={{}} />);
    expect(screen.getByText("Borclu yoxdur")).toBeInTheDocument();
  });

  it("xəta halında panel 'Yüklənmədi' göstərir və Yenidən onRetry çağırır", async () => {
    const refetch = vi.fn();
    const user = userEvent.setup();
    mockUseDebtsKpi.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch,
    } as never);
    render(<DebtsKpiCards range={{}} />);
    const retryButtons = screen.getAllByRole("button", { name: /yenidən/i });
    expect(retryButtons.length).toBeGreaterThan(0);
    await user.click(retryButtons[0]);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  // FE#65 — dövr çipi dəyişəndə (isFetching=true, isLoading=false, köhnə
  // `data` `placeholderData` ilə saxlanılıb) YALNIZ "Bu dövrdə…" sətri
  // loading göstərməlidir; StatCluster/KpiCard dəyişmədən qalmalıdır.
  it("FE#65 — dövr yenilənərkən (isFetching) yalnız dövr sətri loading göstərir, panel sabit qalır", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    } as never);
    const { container } = render(<DebtsKpiCards range={{}} />);

    // Dövr sətri skeleton göstərir, köhnə "Bu dövrdə…" mətni yoxdur.
    expect(screen.queryByText(/Bu dövrdə:/)).not.toBeInTheDocument();

    // StatCluster köhnə/mövcud data ilə görünür, skeleton yox.
    expect(screen.getByText("Ümumi qalıq")).toBeInTheDocument();
    expect(screen.getByText("Borclu sayı")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();

    // Ən böyük borclu kartı da eyni şəkildə sabit qalır.
    expect(screen.getByText("Elvin Məmmədov")).toBeInTheDocument();

    // Yeganə skeleton — dövr sətrindəki (h-3), StatCluster/KpiCard-da yox.
    expect(container.querySelectorAll(".h-3.animate-pulse").length).toBe(1);
    expect(container.querySelectorAll(".h-6.animate-pulse").length).toBe(0);
  });
});
