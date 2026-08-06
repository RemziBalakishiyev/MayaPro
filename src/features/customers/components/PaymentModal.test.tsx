import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentModal } from "./PaymentModal";
import { useAddCustomerPayment } from "../queries";
import type { Customer } from "@/types";

vi.mock("../queries", async () => {
  const actual =
    await vi.importActual<typeof import("../queries")>("../queries");
  return { ...actual, useAddCustomerPayment: vi.fn() };
});

const mockUseAddCustomerPayment = vi.mocked(useAddCustomerPayment);

const customer: Customer = {
  id: "c1",
  name: "Əli Vəliyev",
  phone: "994501234567",
  totalDebt: 2000,
  paidAmount: 500,
  remainingDebt: 1500,
  initialDebt: 0,
  totalPurchases: 2500,
  purchaseCount: 4,
  lastPurchaseDate: "2026-07-01",
  lastPaymentDate: "2026-07-10",
};

/**
 * FE#74 (AC13/AC14, TC13-TC15) — `PaymentModal` "Ödəniş al" açılanda müştəri
 * adı, borc mənbəyi konteksti (mövcud olduqda), ümumi qalıq borc və FIFO
 * izahını göstərir. Forma sahələri/validasiya/submit axını DƏYİŞMİR.
 */
describe("PaymentModal", () => {
  beforeEach(() => {
    mockUseAddCustomerPayment.mockReset();
    mockUseAddCustomerPayment.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
  });

  it("TC13 — 'Borclar' rejimindən kontekstlə açılanda müştəri adı, mal/tarix, ümumi qalıq və FIFO izahı görünür", () => {
    render(
      <PaymentModal
        open
        onClose={vi.fn()}
        customer={customer}
        context={{ description: "10 kq Un", sourceDate: "2026-07-01" }}
      />,
    );
    expect(screen.getByText("Əli Vəliyev")).toBeInTheDocument();
    expect(screen.getByText(/ümumi qalıq borc/i)).toBeInTheDocument();
    expect(screen.getByText("1,500.00 ₼")).toBeInTheDocument();
    expect(screen.getByText("10 kq Un")).toBeInTheDocument();
    expect(
      screen.getByText(/Ödəniş ümumi borcdan silinir \(əvvəl köhnə borclar\)/i),
    ).toBeInTheDocument();
  });

  it("TC14 — kontekst yoxdursa (Müştəri üzrə/CustomerDrawer) mal/tarix sətri olmadan, xətasız açılır", () => {
    render(<PaymentModal open onClose={vi.fn()} customer={customer} />);
    expect(screen.getByText("Əli Vəliyev")).toBeInTheDocument();
    expect(
      screen.getByText(/Ödəniş ümumi borcdan silinir \(əvvəl köhnə borclar\)/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/mənbə:/i)).not.toBeInTheDocument();
  });

  it("TC15 — validasiya dəyişməyib: qalıqdan çox məbləğ 'Məbləğ qalıq borcdan çox ola bilməz' xətası göstərir, submit deaktiv qalır", async () => {
    const user = userEvent.setup();
    render(<PaymentModal open onClose={vi.fn()} customer={customer} />);
    const amountInput = screen.getByRole("spinbutton");
    await user.type(amountInput, "9999");
    expect(
      screen.getByText("Məbləğ qalıq borcdan çox ola bilməz"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ödənişi qəbul et/i }),
    ).toBeDisabled();
  });
});
