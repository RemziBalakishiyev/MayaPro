import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ClosingHistory } from "./ClosingHistory";
import { useClosings } from "../queries";

/**
 * FE#127 (TC-32.4) — bağlanış tarixçəsi sorğusu şəbəkə xətası ilə uğursuz
 * olduqda "Bağlanış yoxdur" boş-siyahı mesajı ƏVƏZİNƏ `InlineError` +
 * "Yenidən cəhd et" düyməsi göstərilməlidir (maliyyə-həssas ekran).
 */
vi.mock("../queries", async () => {
  const actual =
    await vi.importActual<typeof import("../queries")>("../queries");
  return { ...actual, useClosings: vi.fn() };
});

const mockUseClosings = vi.mocked(useClosings);

describe("ClosingHistory — şəbəkə xətası (FE#127)", () => {
  beforeEach(() => {
    mockUseClosings.mockReset();
  });

  it("isError=true olduqda InlineError göstərir, 'Bağlanış yoxdur' YOX", () => {
    mockUseClosings.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as never);

    render(<ClosingHistory />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText("Bağlanış tarixçəsi yüklənmədi"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Bağlanış yoxdur")).not.toBeInTheDocument();
  });

  it("'Yenidən cəhd et' düyməsinə klik useClosings().refetch-i çağırır", async () => {
    const refetch = vi.fn();
    mockUseClosings.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as never);
    const user = userEvent.setup();

    render(<ClosingHistory />);
    await user.click(
      screen.getByRole("button", { name: /yenidən cəhd et/i }),
    );

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("isError=false və closings=[] olduqda normal EmptyState göstərir (regressiya)", () => {
    mockUseClosings.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<ClosingHistory />);

    expect(screen.getByText("Bağlanış yoxdur")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  /**
   * FE#134 (maliyyə-həssas) — kassir artıq bağlanış tarixçəsinə baxıb (data
   * uğurla yüklənib), sonra arxa-fon (background) refetch-i qısa şəbəkə
   * fasiləsi ilə uğursuz olur. TanStack Query `data`-nı ƏVVƏLKİ uğurlu
   * nəticə ilə saxlayır (`isError=true`, `data` mövcud) — bu halda mövcud
   * cədvəl İTMƏMƏLİDİR və tam InlineError ekranı ilə ƏVƏZ OLUNMAMALIDIR.
   */
  it("uğurla yüklənmiş data varkən arxa-fon refetch xətası → köhnə cədvəl itmir, tam InlineError göstərilmir (FE#134)", () => {
    mockUseClosings.mockReturnValue({
      data: [
        {
          id: "c1",
          date: "2026-08-05",
          openingCash: 100,
          cashSales: 500,
          expenses: 50,
          expectedCash: 550,
          actualCash: 550,
          difference: 0,
        },
      ],
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as never);

    render(<ClosingHistory />);

    // Tam InlineError mesajı YOX — mövcud data itməyib
    expect(
      screen.queryByText("Bağlanış tarixçəsi yüklənmədi"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Bağlanış yoxdur")).not.toBeInTheDocument();

    // Kiçik xəbərdarlıq zolağı görünür
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmə uğursuz oldu/i,
    );
  });
});
