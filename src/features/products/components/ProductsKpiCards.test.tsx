import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsKpiCards } from "./ProductsKpiCards";
import { useProductsKpi } from "@/features/reports/queries";

vi.mock("@/features/reports/queries", () => ({
  useProductsKpi: vi.fn(),
}));

const mockUseProductsKpi = vi.mocked(useProductsKpi);

const baseData = {
  productCount: 16,
  totalStockUnits: 240,
  totalCostValue: 5230.5,
  totalSaleValue: 8100,
  potentialProfit: 2869.5,
  lowStockCount: 4,
  soldUnits: 25,
  purchasedUnits: 816,
};

/** FE#61 — Mallar səhifəsi KPI kompozisiyası: təkrarsız, iyerarxiyalı. */
describe("ProductsKpiCards", () => {
  beforeEach(() => {
    mockUseProductsKpi.mockReset();
  });

  it("AC1 — heç bir yerdə 'hazırda' nişanı göstərmir", () => {
    mockUseProductsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<ProductsKpiCards range={{}} />);
    expect(screen.queryByText("hazırda")).not.toBeInTheDocument();
  });

  it("AC2 — dövr filtrinə bağlı sətri göstərir: 'Bu dövrdə: 25 satılıb · 816 alınıb'", () => {
    mockUseProductsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<ProductsKpiCards range={{}} />);
    expect(screen.getByText(/Bu dövrdə:/)).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("816")).toBeInTheDocument();
  });

  it("AC3 — Anbar panelində Mal sayı / Anbardakı ədəd / Maya dəyəri yan-yana göstərilir", () => {
    mockUseProductsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<ProductsKpiCards range={{}} />);
    expect(screen.getByText("Mal sayı")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("Anbardakı ədəd")).toBeInTheDocument();
    expect(screen.getByText("240 ədəd")).toBeInTheDocument();
    expect(screen.getByText("Maya dəyəri")).toBeInTheDocument();
  });

  it("AC4 — Satış dəyəri bloku dəyər + potensial qazanc sətrini göstərir", () => {
    mockUseProductsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<ProductsKpiCards range={{}} />);
    expect(screen.getByText("Satış dəyəri")).toBeInTheDocument();
    expect(screen.getByText(/Potensial qazanc/)).toBeInTheDocument();
  });

  it("AC5 — azalan mal sayı > 0 olduqda kliklənə bilən xəbərdarlıq çipi göstərilir və onLowStockClick çağırır", async () => {
    const onLowStockClick = vi.fn();
    const user = userEvent.setup();
    mockUseProductsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(
      <ProductsKpiCards range={{}} onLowStockClick={onLowStockClick} />,
    );
    const pill = screen.getByRole("button", { name: /4 malın stoku azalır/ });
    await user.click(pill);
    expect(onLowStockClick).toHaveBeenCalledTimes(1);
  });

  it("AC6 — azalan mal sayı 0 olduqda xəbərdarlıq çipi göstərilmir", () => {
    mockUseProductsKpi.mockReturnValue({
      data: { ...baseData, lowStockCount: 0 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    render(<ProductsKpiCards range={{}} />);
    expect(screen.queryByText(/malın stoku azalır/)).not.toBeInTheDocument();
  });

  it("AC7 — xəta halında panel 'Yüklənmədi' göstərir və Yenidən onRetry çağırır", async () => {
    const refetch = vi.fn();
    const user = userEvent.setup();
    mockUseProductsKpi.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as never);
    render(<ProductsKpiCards range={{}} />);
    const retryButtons = screen.getAllByRole("button", { name: /yenidən/i });
    expect(retryButtons.length).toBeGreaterThan(0);
    await user.click(retryButtons[0]);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  // FE#65 — dövr çipi dəyişəndə (isFetching=true, isLoading=false, köhnə
  // `data` `placeholderData` ilə saxlanılıb) YALNIZ "Bu dövrdə…" sətri
  // loading göstərməlidir; StatCluster/KpiCard/AlertPill dəyişmədən qalmalıdır.
  it("FE#65 — dövr yenilənərkən (isFetching) yalnız dövr sətri loading göstərir, panel sabit qalır", () => {
    mockUseProductsKpi.mockReturnValue({
      data: baseData,
      isLoading: false,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    } as never);
    const { container } = render(<ProductsKpiCards range={{}} />);

    // Dövr sətri skeleton göstərir, köhnə "Bu dövrdə…" mətni yoxdur.
    expect(screen.queryByText(/Bu dövrdə:/)).not.toBeInTheDocument();

    // Anbar paneli (StatCluster) köhnə/mövcud data ilə görünür, skeleton yox.
    expect(screen.getByText("Mal sayı")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();

    // Satış dəyəri kartı (KpiCard) da eyni şəkildə sabit qalır.
    expect(screen.getByText("Satış dəyəri")).toBeInTheDocument();
    expect(screen.getByText(/Potensial qazanc/)).toBeInTheDocument();

    // Azalan mal xəbərdarlıq çipi yox olmur.
    expect(
      screen.getByRole("button", { name: /4 malın stoku azalır/ }),
    ).toBeInTheDocument();

    // Yeganə skeleton — dövr sətrindəki (h-3), StatCluster/KpiCard-da yox
    // (onlar h-6 skeleton bar istifadə edir).
    expect(container.querySelectorAll(".h-3.animate-pulse").length).toBe(1);
    expect(container.querySelectorAll(".h-6.animate-pulse").length).toBe(0);
  });
});
