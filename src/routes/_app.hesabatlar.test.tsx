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
// FE#78 — `useSearch`/`useNavigate` stub-larının vəziyyəti `vi.hoisted` ilə
// paylaşılır ki, ayrı-ayrı testlər (məs. köhnə `?period=` keçidi) URL-i
// idarə edə bilsin, mock factory isə modul yüklənməzdən əvvəl işə düşsün.
const { mockSearch, mockNavigate, resetRouterMock } = vi.hoisted(() => {
  const navigateFn = vi.fn();
  return {
    mockSearch: { from: undefined as string | undefined, to: undefined as string | undefined, period: undefined as string | undefined },
    mockNavigate: navigateFn,
    resetRouterMock: () => {
      navigateFn.mockReset();
    },
  };
});

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
      useSearch: () => mockSearch,
      useNavigate: () => mockNavigate,
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
    resetRouterMock();
    mockSearch.from = undefined;
    mockSearch.to = undefined;
    mockSearch.period = undefined;
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

describe("Hesabatlar — dizayn sisteminə keçid (FE#78)", () => {
  beforeEach(() => {
    mockUseReportsData.mockReset();
    resetRouterMock();
    mockSearch.from = undefined;
    mockSearch.to = undefined;
    mockSearch.period = undefined;
    mockUseReportsData.mockReturnValue({
      data: reportsData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

  it("bənd #4: standart PeriodFilter (SegmentedDateFilter) toolbar-da render olunur — köhnə düymə qrupu YOXDUR", () => {
    render(<HesabatlarPage />);
    expect(screen.getByRole("tablist", { name: "Dövr" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Bu ay" })).toBeInTheDocument();
  });

  it("bənd #1/#2/#3: 6 KPI kartı `KpiCard` kompozisiya dili ilə göstərilir", () => {
    render(<HesabatlarPage />);
    for (const label of [
      "Satış",
      "Xalis qazanc",
      "Xərc",
      "Anbar dəyəri",
      "Nağd satış",
      "Nisyə satış",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("köhnə '?period=week' linki mount zamanı from/to aralığına çevrilir və URL-dən silinir", () => {
    mockSearch.period = "week";
    render(<HesabatlarPage />);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const call = mockNavigate.mock.calls[0][0] as {
      search: (prev: typeof mockSearch) => Record<string, unknown>;
      replace?: boolean;
    };
    const nextSearch = call.search(mockSearch);
    expect(nextSearch.period).toBeUndefined();
    expect(typeof nextSearch.from).toBe("string");
    expect(typeof nextSearch.to).toBe("string");
    expect(call.replace).toBe(true);
  });

  it("URL-də artıq from/to varsa köhnə '?period=' keçidi TƏTBİQ OLUNMUR", () => {
    mockSearch.period = "week";
    mockSearch.from = "2026-08-01";
    mockSearch.to = "2026-08-07";
    render(<HesabatlarPage />);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
