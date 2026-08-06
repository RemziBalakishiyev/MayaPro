import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OpenDebtsTable } from "./OpenDebtsTable";
import type { Customer, OpenDebt } from "@/types";

function makeDebt(overrides: Partial<OpenDebt> = {}): OpenDebt {
  return {
    customerId: "c1",
    customerName: "Əli Vəliyev",
    phone: "994501234567",
    source: "sale",
    sourceDate: "2026-07-01",
    description: "10 kq Un",
    originalAmount: 500,
    paidSoFar: 0,
    remaining: 500,
    daysOld: 5,
    ...overrides,
  };
}

const customer: Customer = {
  id: "c1",
  name: "Əli Vəliyev",
  phone: "994501234567",
  totalDebt: 500,
  paidAmount: 0,
  remainingDebt: 500,
  initialDebt: 0,
  totalPurchases: 500,
  purchaseCount: 1,
  lastPurchaseDate: "",
  lastPaymentDate: "",
};

function desktopTable(container: HTMLElement): HTMLElement {
  const table = container.querySelector("table");
  if (!table) throw new Error("Desktop <table> tapılmadı");
  return table as HTMLElement;
}

/** FE#74 (AC7/AC8, TC5-TC8) — borc yaşı sadə dillə + 3 pilləli ciddilik. */
describe("OpenDebtsTable — borc yaşı vurğusu", () => {
  it("TC5 — 5 gün (təzə) neytral tondadır, ikon yoxdur", () => {
    const { container } = render(
      <OpenDebtsTable
        debts={[makeDebt({ daysOld: 5 })]}
        customersById={new Map([["c1", customer]])}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    const label = within(table).getByText("5 gün əvvəl");
    expect(label.closest("p")).toHaveClass("text-stone-400");
    expect(table.querySelector("svg.lucide-alert-triangle")).toBeNull();
  });

  it("TC6 — 35 gün (köhnə) amber/narıncı tondadır, qırmızı YOXDUR", () => {
    const { container } = render(
      <OpenDebtsTable
        debts={[makeDebt({ daysOld: 35 })]}
        customersById={new Map([["c1", customer]])}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    const label = within(table).getByText("35 gün əvvəl");
    expect(label.closest("p")).toHaveClass("text-amber-600");
    expect(label.closest("p")).not.toHaveClass("text-red-600");
  });

  it("TC7 — 65 gün (çox köhnə) kritik tonda VƏ ikonla göstərilir", () => {
    const { container } = render(
      <OpenDebtsTable
        debts={[makeDebt({ daysOld: 65 })]}
        customersById={new Map([["c1", customer]])}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    const label = within(table).getByText("65 gün əvvəl");
    expect(label.closest("p")).toHaveClass("text-red-600");
    expect(
      label.closest("p")?.querySelector("svg"),
    ).not.toBeNull();
  });

  it("Bu gün yaranan borc 'Bu gün' mətnini göstərir (format dəyişməyib)", () => {
    const { container } = render(
      <OpenDebtsTable
        debts={[makeDebt({ daysOld: 0 })]}
        customersById={new Map([["c1", customer]])}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    expect(
      within(desktopTable(container)).getByText("Bu gün"),
    ).toBeInTheDocument();
  });
});

/** FE#74 (AC10/AC12, TC16/TC17) — "Xatırlat" etiketi + WhatsApp axını qorunur. */
describe("OpenDebtsTable — sətir əməliyyatları", () => {
  it("TC16 — 'Xatırlat' ikon + görünən mətnlə göstərilir (yalnız-ikon deyil)", () => {
    const { container } = render(
      <OpenDebtsTable
        debts={[makeDebt()]}
        customersById={new Map([["c1", customer]])}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    const link = within(table).getByRole("link", { name: /xatırlat/i });
    expect(link).toHaveTextContent("Xatırlat");
  });

  it("TC17 — WhatsApp linki wa.me + {debt} əvəzlənmiş şablonla açılır", () => {
    const { container } = render(
      <OpenDebtsTable
        debts={[makeDebt()]}
        customersById={new Map([["c1", customer]])}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    const link = within(table).getByRole("link", { name: /xatırlat/i });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/994501234567?text="),
    );
  });

  it("AC12 — 'Ödəniş al' klik ediləndə onPay müştəri + borc mənbəyi konteksti ilə çağrılır", async () => {
    const onPay = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <OpenDebtsTable
        debts={[makeDebt({ description: "10 kq Un", sourceDate: "2026-07-01" })]}
        customersById={new Map([["c1", customer]])}
        onPay={onPay}
        onView={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    await user.click(
      within(table).getByRole("button", { name: "Ödəniş al" }),
    );
    expect(onPay).toHaveBeenCalledWith(
      expect.objectContaining({ id: "c1" }),
      { description: "10 kq Un", sourceDate: "2026-07-01" },
    );
  });
});

describe("OpenDebtsTable — boş/xəta vəziyyətləri (AC16)", () => {
  it("isError=true olduqda InlineError göstərir", () => {
    render(
      <OpenDebtsTable
        debts={[]}
        isError
        onRetry={vi.fn()}
        customersById={new Map()}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Borclar yüklənmədi")).toBeInTheDocument();
  });

  it("boş siyahıda defolt 'Açıq borc yoxdur' göstərir", () => {
    render(
      <OpenDebtsTable
        debts={[]}
        customersById={new Map()}
        onPay={vi.fn()}
        onView={vi.fn()}
      />,
    );
    expect(screen.getByText("Açıq borc yoxdur")).toBeInTheDocument();
  });

  it("axtarışa uyğun nəticə yoxdursa fərqli boş mesaj göstərir (emptyState prop)", () => {
    render(
      <OpenDebtsTable
        debts={[]}
        customersById={new Map()}
        onPay={vi.fn()}
        onView={vi.fn()}
        emptyState={{ title: "Axtarışa uyğun borc yoxdur" }}
      />,
    );
    expect(screen.getByText("Axtarışa uyğun borc yoxdur")).toBeInTheDocument();
  });
});
