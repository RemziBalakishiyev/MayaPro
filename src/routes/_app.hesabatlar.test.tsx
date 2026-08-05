import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentType } from "react";

/**
 * FE#103 (TC-32): Hesabatlar səhifəsi şəbəkə xətası ilə uğursuz olduqda
 * sonsuz `<Spinner />` ƏVƏZİNƏ `InlineError` + "Yenidən" göstərilməlidir;
 * yüklənmə fazasında `LoadingSkeleton` göstərilir, sonsuz spinner YOXDUR.
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

describe("Hesabatlar — şəbəkə xətası / yüklənmə (FE#103)", () => {
  beforeEach(() => {
    mockUseReportsData.mockReset();
  });

  it("isError=true olduqda InlineError göstərir, sonsuz spinner YOX", () => {
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

  it("isLoading=true olduqda LoadingSkeleton göstərir, alert və sonsuz spinner YOX", () => {
    mockUseReportsData.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);

    const { container } = render(<HesabatlarPage />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
