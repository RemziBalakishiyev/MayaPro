import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentType } from "react";

/**
 * FE#142 (TC-32): Hesabatlar səhifəsi şəbəkə xətası ilə uğursuz olduqda
 * sonsuz `<Spinner />` ƏVƏZİNƏ `InlineError` + "Yenidən" göstərilməlidir.
 * Əvvəl uğurla yüklənmiş data varkən arxa-fon refetch xətası isə mövcud
 * hesabatı İTİRMƏMƏLİDİR — yalnız kiçik xəbərdarlıq zolağı göstərilir.
 */
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );
  return {
    ...actual,
    // Hesabatlar `Route.useSearch()` / `Route.useNavigate()` çağırır — real
    // router konteksti olmadan bunlar idarə oluna bilən stub-larla əvəzlənir.
    createFileRoute: () => (options: Record<string, unknown>) => ({
      options,
      useSearch: () => ({ period: "month" }),
      useNavigate: () => vi.fn(),
    }),
  };
});

vi.mock("@/features/reports/queries", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/reports/queries")
  >("@/features/reports/queries");
  return {
    ...actual,
    useReportsData: vi.fn(),
    useSummary: vi.fn(() => ({ data: undefined })),
  };
});

import { Route } from "./_app.hesabatlar";
import { useReportsData } from "@/features/reports/queries";

const mockUseReportsData = vi.mocked(useReportsData);
const HesabatlarPage = Route.options.component as ComponentType;

const reportsData = {
  products: [],
  sales: [],
  customers: [],
  suppliers: [],
  expenses: [],
  employees: [],
  closings: [],
  payments: [],
};

describe("Hesabatlar — şəbəkə xətası (FE#142)", () => {
  beforeEach(() => {
    mockUseReportsData.mockReset();
  });

  it("isError=true, heç vaxt yüklənməyib → InlineError göstərir, sonsuz spinner YOX", () => {
    const refetch = vi.fn();
    mockUseReportsData.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as never);

    render(<HesabatlarPage />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Hesabatlar yüklənmədi")).toBeInTheDocument();
  });

  it("'Yenidən' düyməsinə klik refetch-i çağırır", async () => {
    const refetch = vi.fn();
    mockUseReportsData.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as never);
    const user = userEvent.setup();

    render(<HesabatlarPage />);
    await user.click(screen.getByRole("button", { name: /yenidən/i }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("isLoading=true olduqda skeleton göstərir, alert YOX (regressiya)", () => {
    mockUseReportsData.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<HesabatlarPage />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("uğurla yüklənmiş data varkən arxa-fon refetch xətası → hesabat itmir, tam InlineError göstərilmir (FE#142)", () => {
    const refetch = vi.fn();
    mockUseReportsData.mockReturnValue({
      data: reportsData,
      isLoading: false,
      isError: true,
      refetch,
    } as never);

    render(<HesabatlarPage />);

    expect(
      screen.queryByText("Hesabatlar yüklənmədi"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Satış")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmədi|köhnəlmiş/i,
    );
  });

  it("isError=false, data mövcud → normal Hesabatlar, alert YOX (regressiya)", () => {
    mockUseReportsData.mockReturnValue({
      data: reportsData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<HesabatlarPage />);

    expect(screen.getByText("Satış")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
