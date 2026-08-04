import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OpenDebtsView } from "./OpenDebtsView";
import { useOpenDebts } from "../queries";
import type { Customer, OpenDebt } from "@/types";

vi.mock("../queries", async () => {
  const actual = await vi.importActual<typeof import("../queries")>(
    "../queries",
  );
  return { ...actual, useOpenDebts: vi.fn() };
});

const mockUseOpenDebts = vi.mocked(useOpenDebts);

const debts: OpenDebt[] = [
  {
    customerId: "c1",
    customerName: "Əli Vəliyev",
    phone: "994501234567",
    source: "sale",
    sourceDate: "2026-07-01",
    description: "Mal A",
    originalAmount: 2000,
    paidSoFar: 0,
    remaining: 2000,
    daysOld: 10,
  },
  {
    customerId: "c2",
    customerName: "QA Borclu",
    phone: null,
    source: "initialDebt",
    sourceDate: "2026-06-01",
    description: "İlkin borc",
    originalAmount: 1529,
    paidSoFar: 0,
    remaining: 1529,
    daysOld: 40,
  },
];

const customers: Customer[] = [
  {
    id: "c1",
    name: "Əli Vəliyev",
    phone: "994501234567",
    totalDebt: 2000,
    paidAmount: 0,
    remainingDebt: 2000,
    initialDebt: 0,
    totalPurchases: 0,
    purchaseCount: 0,
    lastPurchaseDate: "",
    lastPaymentDate: "",
  },
  {
    id: "c2",
    name: "QA Borclu",
    phone: "",
    totalDebt: 1529,
    paidAmount: 0,
    remainingDebt: 1529,
    initialDebt: 1529,
    totalPurchases: 0,
    purchaseCount: 0,
    lastPurchaseDate: "",
    lastPaymentDate: "",
  },
];

/** FE#63 — cədvəl üstündəki nəhəng "Ümumi qalıq borc" kartı silinib; ümumi
 * rəqəm YALNIZ KPI panelindədir. Cədvəlin altında yalnız GÖRÜNƏN sətirlərin
 * kiçik cəm sətri var. */
describe("OpenDebtsView", () => {
  beforeEach(() => {
    mockUseOpenDebts.mockReset();
    mockUseOpenDebts.mockReturnValue({
      data: { items: debts, totalRemaining: 3529 },
      isLoading: false,
    } as never);
  });

  it("nəhəng 'Ümumi qalıq borc' StatCard-ı göstərmir", () => {
    render(
      <OpenDebtsView
        q=""
        customers={customers}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    expect(screen.queryByText("Ümumi qalıq borc")).not.toBeInTheDocument();
  });

  it("cədvəlin altında görünən sətirlərin sayı və cəmini göstərir (filtrsiz — hamısı)", () => {
    render(
      <OpenDebtsView
        q=""
        customers={customers}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    const summary = screen.getByTestId("open-debts-summary");
    expect(within(summary).getByText("Görünən:")).toBeInTheDocument();
    expect(within(summary).getByText("2 borc")).toBeInTheDocument();
    expect(within(summary).getByText(/3,529/)).toBeInTheDocument();
  });

  it("axtarışla filtrlənəndə cəm sətri dəyişir və fərq görünür", () => {
    render(
      <OpenDebtsView
        q="Əli"
        customers={customers}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    const summary = screen.getByTestId("open-debts-summary");
    expect(within(summary).getByText("1 borc")).toBeInTheDocument();
    expect(within(summary).getByText(/2,000/)).toBeInTheDocument();
    expect(within(summary).getByText("(axtarışa uyğun)")).toBeInTheDocument();
  });

  it("telefonu olmayan müştəri (QA Borclu) sətrində dash göstərmir", () => {
    render(
      <OpenDebtsView
        q=""
        customers={customers}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    expect(screen.getAllByText("QA Borclu").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("—")).toHaveLength(0);
  });

  /**
   * FE#87 (TC-32.9/32.10) — açıq borc sorğusu şəbəkə xətası ilə uğursuz
   * olduqda boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən" göstərilir;
   * "Yenidən" `useOpenDebts().refetch`-ə bağlanır.
   */
  describe("şəbəkə xətası (FE#87)", () => {
    it("isError=true olduqda InlineError göstərir, boş-siyahı mesajı YOX", () => {
      mockUseOpenDebts.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: vi.fn(),
      } as never);
      render(
        <OpenDebtsView
          q=""
          customers={customers}
          onPay={vi.fn()}
          onView={vi.fn()}
        />,
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Borclar yüklənmədi")).toBeInTheDocument();
      expect(screen.queryByText("Açıq borc yoxdur")).not.toBeInTheDocument();
    });

    it("'Yenidən' düyməsinə klik useOpenDebts().refetch-i çağırır", async () => {
      const refetch = vi.fn();
      mockUseOpenDebts.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch,
      } as never);
      const user = userEvent.setup();
      render(
        <OpenDebtsView
          q=""
          customers={customers}
          onPay={vi.fn()}
          onView={vi.fn()}
        />,
      );
      await user.click(screen.getByRole("button", { name: /yenidən/i }));
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });
});
