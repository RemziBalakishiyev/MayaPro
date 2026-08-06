import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ClosingHistory } from "./ClosingHistory";
import { useClosings } from "../queries";
import type { Closing } from "@/types";

/**
 * FE#142 — bağlanış tarixçəsi sorğusu şəbəkə xətası ilə uğursuz olduqda
 * "Bağlanış yoxdur" boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən"
 * düyməsi göstərilməlidir (maliyyə-həssas ekran). Əvvəl uğurla yüklənmiş
 * data varkən arxa-fon refetch xətası isə mövcud cədvəli İTİRMƏMƏLİDİR.
 */
vi.mock("../queries", async () => {
  const actual =
    await vi.importActual<typeof import("../queries")>("../queries");
  return { ...actual, useClosings: vi.fn() };
});

const mockUseClosings = vi.mocked(useClosings);

const closing: Closing = {
  id: "c1",
  date: "2026-08-05",
  openingCash: 100,
  cashSales: 500,
  cardSales: 0,
  creditSales: 0,
  expenses: 50,
  expectedCash: 550,
  actualCash: 550,
  difference: 0,
};

describe("ClosingHistory — şəbəkə xətası (FE#142)", () => {
  beforeEach(() => {
    mockUseClosings.mockReset();
  });

  it("isError=true, heç vaxt yüklənməyib → InlineError göstərir, 'Bağlanış yoxdur' YOX", () => {
    mockUseClosings.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      dataUpdatedAt: 0,
      refetch: vi.fn(),
    } as never);

    render(<ClosingHistory />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText("Bağlanış tarixçəsi yüklənmədi"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Bağlanış yoxdur")).not.toBeInTheDocument();
  });

  it("'Yenidən' düyməsinə klik useClosings().refetch-i çağırır", async () => {
    const refetch = vi.fn();
    mockUseClosings.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      dataUpdatedAt: 0,
      refetch,
    } as never);
    const user = userEvent.setup();

    render(<ClosingHistory />);
    await user.click(screen.getByRole("button", { name: /yenidən/i }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("isError=false və closings=[] olduqda normal EmptyState göstərir (regressiya)", () => {
    mockUseClosings.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    } as never);

    render(<ClosingHistory />);

    expect(screen.getByText("Bağlanış yoxdur")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("uğurla yüklənmiş data varkən arxa-fon refetch xətası → köhnə cədvəl itmir, tam InlineError göstərilmir (FE#142)", () => {
    mockUseClosings.mockReturnValue({
      data: [closing],
      isLoading: false,
      isError: true,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    } as never);

    render(<ClosingHistory />);

    expect(
      screen.queryByText("Bağlanış tarixçəsi yüklənmədi"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Bağlanış yoxdur")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmə uğursuz oldu/i,
    );
  });

  it("uğurla yüklənmiş BOŞ data + arxa-fon refetch xətası → EmptyState + StaleDataBanner göstərilir, tam InlineError YOX (FE#142)", () => {
    mockUseClosings.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    } as never);

    render(<ClosingHistory />);

    expect(
      screen.queryByText("Bağlanış tarixçəsi yüklənmədi"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Bağlanış yoxdur")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmə uğursuz oldu/i,
    );
  });
});
