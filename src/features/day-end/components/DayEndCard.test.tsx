import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DayEndCard } from "./DayEndCard";
import { useClosings, useTodayClosing, useCloseDay } from "../queries";
import { useSummary } from "@/features/reports/queries";
import { useCan } from "@/features/auth/store";
import { ApiError } from "@/lib/api-client";
import type { Closing } from "@/types";
import type { SummaryData } from "@/features/reports/api";

/**
 * FE#77 — "Gün Sonu" səhifəsinin maliyyə-həssas UI refactor testləri.
 * Hesablama düsturlarına (`expectedCash`/`difference`) TOXUNULMUR — bu
 * fayl YALNIZ təqdimatı (3 mərhələli axın, fərq semantikası, deaktiv
 * səbəbi, artıq-bağlanıb və API xətası vəziyyətləri) yoxlayır.
 */
vi.mock("../queries", async () => {
  const actual = await vi.importActual<typeof import("../queries")>("../queries");
  return {
    ...actual,
    useClosings: vi.fn(),
    useTodayClosing: vi.fn(),
    useCloseDay: vi.fn(),
  };
});

vi.mock("@/features/reports/queries", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/reports/queries")>(
      "@/features/reports/queries",
    );
  return { ...actual, useSummary: vi.fn() };
});

vi.mock("@/features/auth/store", () => ({
  useCan: vi.fn(),
}));

const mockUseClosings = vi.mocked(useClosings);
const mockUseTodayClosing = vi.mocked(useTodayClosing);
const mockUseCloseDay = vi.mocked(useCloseDay);
const mockUseSummary = vi.mocked(useSummary);
const mockUseCan = vi.mocked(useCan);

const baseSummary: SummaryData = {
  period: "today",
  from: null,
  to: null,
  salesTotal: 500,
  profit: 120,
  expenses: 50,
  salesCount: 3,
  netProfit: 70,
  cashSales: 400,
  cardSales: 80,
  creditSales: 20,
};

const closedToday: Closing = {
  id: "cls-today",
  date: "2026-08-07",
  openingCash: 100,
  cashSales: 400,
  cardSales: 80,
  creditSales: 20,
  expenses: 50,
  expectedCash: 450,
  actualCash: 450,
  difference: 0,
};

function setupDefaults() {
  mockUseClosings.mockReturnValue({ data: [] } as never);
  mockUseTodayClosing.mockReturnValue({
    data: null,
    refetch: vi.fn(),
  } as never);
  mockUseCloseDay.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(closedToday),
    isPending: false,
  } as never);
  mockUseSummary.mockReturnValue({ data: baseSummary } as never);
  mockUseCan.mockReturnValue(() => true);
}

describe("DayEndCard (FE#77 - maliyye-hessas UI refactor)", () => {
  beforeEach(() => {
    mockUseClosings.mockReset();
    mockUseTodayClosing.mockReset();
    mockUseCloseDay.mockReset();
    mockUseSummary.mockReset();
    mockUseCan.mockReset();
    setupDefaults();
  });

  it("bend #2/#4: uc nomrelenmis merhele gosterir, gozlenilen meblegh qabariqdir", () => {
    render(<DayEndCard />);

    expect(screen.getByText("Bugünkü hesabı yoxla")).toBeInTheDocument();
    expect(screen.getByText("Kassadakı faktiki pulu yaz")).toBeInTheDocument();
    expect(screen.getByText("Fərqi yoxla və günü bağla")).toBeInTheDocument();
    expect(
      screen.getByText("Bu günün sonunda kassada olmalı"),
    ).toBeInTheDocument();
    // expected = openingCash(0, toxunulmayib) + 400 - 50 = 350.00
    expect(screen.getByText(/350\.00/)).toBeInTheDocument();
  });

  it("bend #3: oxunan deyerler (satis/xerc) input kimi gosterilmir, acilis kassasi ise redakte oluna bilen qalir", () => {
    render(<DayEndCard />);

    // Açılış kassası — mövcud davranış: hələ də input.
    expect(
      screen.getByRole("spinbutton", { name: /başlanğıc kassa/i }),
    ).toBeInTheDocument();
    // Nağd/kart/nisyə/xərc sətirləri isə sadə mətndir (input yoxdur onlar üçün).
    expect(screen.getByText("Kart satış (kassaya düşmür)")).toBeInTheDocument();
    expect(
      screen.queryByRole("spinbutton", { name: /nağd satış/i }),
    ).not.toBeInTheDocument();
  });

  it("bend #7: faktiki mebleg yazilmayibsa 'Gunu bagla' deaktivdir ve sebeb yazilir", () => {
    render(<DayEndCard />);

    const btn = screen.getByRole("button", { name: /günü bağla/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText("Faktiki məbləği yazın")).toBeInTheDocument();
  });

  it("bend #5/#6: musbet ferq CANLI gosterilir, YASIL yox, xeberdarliq (kehreba) tonundadir", async () => {
    const user = userEvent.setup();
    render(<DayEndCard />);

    const input = screen.getByLabelText(/faktiki sayılan pul/i);
    await user.type(input, "400");

    // expected=350, actual=400 -> diff=+50 (musbet)
    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent(/kassa uyğun gəlmir/i);
    expect(banner).toHaveTextContent(/50\.00/);
    expect(banner.className).toContain("bg-amber-50");
    expect(banner.className).not.toContain("bg-emerald-50");
  });

  it("bend #6: menfi ferq qirmizi qalir (regressiya yoxdur)", async () => {
    const user = userEvent.setup();
    render(<DayEndCard />);

    const input = screen.getByLabelText(/faktiki sayılan pul/i);
    await user.type(input, "300");

    // expected=350, actual=300 -> diff=-50
    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent(/çatışmayan/i);
    expect(banner.className).toContain("bg-red-50");
  });

  it("bend #6: sifir ferq yasil ugur tonundadir", async () => {
    const user = userEvent.setup();
    render(<DayEndCard />);

    const input = screen.getByLabelText(/faktiki sayılan pul/i);
    await user.type(input, "350");

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent(/kassa düz gəlir/i);
    expect(banner.className).toContain("bg-emerald-50");
  });

  it("bend #8: 'Gunu bagla' kliklendikde ConfirmDialog gozlenilen/faktiki/ferq/tarixi gosterir", async () => {
    const user = userEvent.setup();
    render(<DayEndCard />);

    await user.type(screen.getByLabelText(/faktiki sayılan pul/i), "400");
    await user.click(screen.getByRole("button", { name: /günü bağla/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Olmalı idi")).toBeInTheDocument();
    expect(within(dialog).getByText("Sayıldı")).toBeInTheDocument();
    expect(within(dialog).getByText("Tarix")).toBeInTheDocument();
    expect(
      within(dialog).getByText(/bu qeyd dəyişdirilə bilməz/i),
    ).toBeInTheDocument();
  });

  it("bend #9: qeyd sahesi isteye baglidir - dolu olmadan da baglana bilir", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(closedToday);
    mockUseCloseDay.mockReturnValue({ mutateAsync, isPending: false } as never);
    const user = userEvent.setup();
    render(<DayEndCard />);

    await user.type(screen.getByLabelText(/faktiki sayılan pul/i), "350");
    await user.click(screen.getByRole("button", { name: /günü bağla/i }));
    await user.click(
      screen.getByRole("button", { name: /bəli, günü bağla/i }),
    );

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ actualCash: 350, note: undefined }),
    );
  });

  it("bend #12 (409): 'artiq baglanib' xetasinda dialoq acig qalir, sebeb gosterilir, todayClosing yenilenir", async () => {
    const refetch = vi.fn();
    mockUseTodayClosing.mockReturnValue({ data: null, refetch } as never);
    const mutateAsync = vi
      .fn()
      .mockRejectedValue(new ApiError("Bu gün artıq bağlanıb", "DayEnd.AlreadyClosed", 409));
    mockUseCloseDay.mockReturnValue({ mutateAsync, isPending: false } as never);
    const user = userEvent.setup();
    render(<DayEndCard />);

    await user.type(screen.getByLabelText(/faktiki sayılan pul/i), "350");
    await user.click(screen.getByRole("button", { name: /günü bağla/i }));
    await user.click(
      screen.getByRole("button", { name: /bəli, günü bağla/i }),
    );

    // Dialoq bağlanmır (F-43 — xəta halında açıq qalır) və səbəb görünür.
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /bu gün artıq bağlanıb/i,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(refetch).toHaveBeenCalled();
  });

  it("bend #12: artiq baglanibsa (todayClosing dolu) xulase karti gosterir, 'Olmali idi'/'Sayildi' etiketleri ile", () => {
    mockUseTodayClosing.mockReturnValue({
      data: closedToday,
      refetch: vi.fn(),
    } as never);
    render(<DayEndCard />);

    expect(screen.getByText(/bu gün artıq bağlanıb/i)).toBeInTheDocument();
    expect(screen.getByText("Olmalı idi")).toBeInTheDocument();
    expect(screen.getByText("Sayıldı")).toBeInTheDocument();
    expect(
      screen.getByText("Gün bağlanıb — dəyişiklik mümkün deyil."),
    ).toBeInTheDocument();
  });

  it("canClose=false olduqda kilid mesaji gosterir, input gostermir", () => {
    mockUseCan.mockReturnValue(() => false);
    render(<DayEndCard />);

    expect(
      screen.getByText("Günü yalnız sahibkar bağlaya bilər."),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/faktiki sayılan pul/i),
    ).not.toBeInTheDocument();
  });
});
