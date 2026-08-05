import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DebtsKpiCards, DebtsPeriodLine } from "./DebtsKpiCards";
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

/** FE#61/FE#63 — Nisyə Borclar səhifəsi KPI kompozisiyası. */
describe("DebtsPeriodLine", () => {
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
    render(<DebtsPeriodLine range={{}} />);
    expect(screen.getByText(/Bu dövrdə:/)).toBeInTheDocument();
    expect(screen.getByText(/borc yarandı/)).toBeInTheDocument();
    expect(screen.getByText(/ödəniş yığıldı/)).toBeInTheDocument();
  });

  it("dövr yenilənərkən (isFetching) skeleton göstərir, 'Bu dövrdə' mətni yoxdur", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    } as never);
    const { container } = render(<DebtsPeriodLine range={{}} />);
    expect(screen.queryByText(/Bu dövrdə:/)).not.toBeInTheDocument();
    expect(container.querySelectorAll(".h-3.animate-pulse").length).toBe(1);
  });
});

describe("DebtsKpiCards", () => {
  beforeEach(() => {
    mockUseDebtsKpi.mockReset();
  });

  it("Ümumi qalıq / Borclu sayı / Ən köhnə borc günü BORC VƏZİYYƏTİ panelində görünür", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<DebtsKpiCards range={{}} />);
    expect(screen.getByText("Ümumi qalıq")).toBeInTheDocument();
    expect(screen.getByText(/4[.,]?200/)).toBeInTheDocument();
    expect(screen.getByText("Borclu sayı")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Ən köhnə borc günü")).toBeInTheDocument();
    expect(screen.getByText("42 gün")).toBeInTheDocument();
  });

  it("60+ gün ən köhnə borcu qırmızı rənglə vurğulayır", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: { ...baseData, oldestDebtDays: 61 },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<DebtsKpiCards range={{}} />);
    expect(screen.getByText("61 gün")).toHaveClass("text-red-600");
  });

  it("30 gün (60-dan az) ən köhnə borcu qırmızı ilə vurğulamır", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: { ...baseData, oldestDebtDays: 30 },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<DebtsKpiCards range={{}} />);
    expect(screen.getByText("30 gün")).not.toHaveClass("text-red-600");
  });

  it("Ən çox borclu kartı ad + məbləği göstərir", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<DebtsKpiCards range={{}} />);
    expect(screen.getByText("Ən çox borclu")).toBeInTheDocument();
    expect(screen.getByText("Elvin Məmmədov")).toBeInTheDocument();
  });

  it("Ən çox borclu kartına klik ediləndə onSelectDebtor topDebtor adı ilə çağrılır", async () => {
    const user = userEvent.setup();
    const onSelectDebtor = vi.fn();
    mockUseDebtsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<DebtsKpiCards range={{}} onSelectDebtor={onSelectDebtor} />);
    await user.click(
      screen.getByRole("button", { name: /Elvin Məmmədov üzrə filtrlə/i }),
    );
    expect(onSelectDebtor).toHaveBeenCalledWith("Elvin Məmmədov");
  });

  it("borclu yoxdursa 'Borclu yoxdur' göstərir və kart klikə bağlanmır", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: { ...baseData, topDebtor: null },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<DebtsKpiCards range={{}} />);
    expect(screen.getByText("Borclu yoxdur")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ən çox borclu" }),
    ).toBeDisabled();
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

  // FE#125 — design-system.md §1.6 (AC-8/TC-6): bütün interaktiv kontrollar
  // min 40px toxunma hədəfinə malik olmalıdır.
  it("FE#125 — xəta halında 'Yenidən' düymələri min-h-[40px] sinifinə malikdir", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    } as never);
    render(<DebtsKpiCards range={{}} />);
    const retryButtons = screen.getAllByRole("button", { name: /yenidən/i });
    expect(retryButtons.length).toBeGreaterThan(0);
    retryButtons.forEach((btn) => expect(btn.className).toContain("min-h-[40px]"));
  });

  // FE#65 — dövr çipi dəyişəndə (isFetching=true, isLoading=false, köhnə
  // `data` `placeholderData` ilə saxlanılıb) panel sabit qalmalıdır (bu
  // panel period-dən asılı deyil, "Bu dövrdə" sətri ayrıca komponentdədir).
  it("FE#65 — dövr yenilənərkən (isFetching) panel sabit qalır, skeleton göstərmir", () => {
    mockUseDebtsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    } as never);
    const { container } = render(<DebtsKpiCards range={{}} />);

    expect(screen.getByText("Ümumi qalıq")).toBeInTheDocument();
    expect(screen.getByText("Borclu sayı")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Elvin Məmmədov")).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBe(0);
  });
});
