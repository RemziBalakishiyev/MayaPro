import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { daysAgoISO } from "@/lib/format";
import { CustomersTable } from "./CustomersTable";
import type { Customer } from "@/types";

/**
 * FE#87 (TC-32.3/32.4, TC-32.9/32.10) — müştəri sorğusu şəbəkə xətası ilə
 * uğursuz olduqda "Hələ müştəri yoxdur" boş-siyahı mesajı ƏVƏZİNƏ
 * `InlineError` + "Yenidən" düyməsi göstərilməlidir.
 */
describe("CustomersTable — şəbəkə xətası (FE#87)", () => {
  it("isError=true olduqda InlineError göstərir, 'Hələ müştəri yoxdur' YOX", () => {
    render(
      <CustomersTable
        customers={[]}
        isError
        onRetry={vi.fn()}
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Müştərilər yüklənmədi")).toBeInTheDocument();
    expect(screen.queryByText("Hələ müştəri yoxdur")).not.toBeInTheDocument();
  });

  it("'Yenidən' düyməsinə klik onRetry-ni çağırır", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <CustomersTable
        customers={[]}
        isError
        onRetry={onRetry}
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("isError=false və data=[] olduqda normal EmptyState göstərir (regressiya)", () => {
    render(
      <CustomersTable customers={[]} onView={vi.fn()} onPay={vi.fn()} />,
    );
    expect(screen.getByText("Hələ müştəri yoxdur")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c1",
    name: "Elvin Məmmədov",
    phone: "994501234567",
    note: undefined,
    totalDebt: 200,
    paidAmount: 0,
    remainingDebt: 200,
    initialDebt: 0,
    totalPurchases: 500,
    purchaseCount: 3,
    lastPurchaseDate: daysAgoISO(5),
    lastPaymentDate: daysAgoISO(5),
    createdAt: daysAgoISO(30),
    ...overrides,
  };
}

/**
 * `DataTable` desktop cədvəli VƏ mobil kartı EYNİ ANDA DOM-a render edir
 * (CSS `hidden md:block` / `md:hidden` ilə görünürlük idarə olunur — jsdom-da
 * hər ikisi mövcuddur). Ona görə sətir-səviyyəli assertlər desktop
 * `<table>`-ə `within(...)` ilə əhatələnir ki, "tapılan çox element" xətası
 * olmasın (bax `OpenDebtsView.test.tsx` — eyni naxış).
 */
function desktopTable(container: HTMLElement): HTMLElement {
  const table = container.querySelector("table");
  if (!table) throw new Error("Desktop <table> tapılmadı");
  return table as HTMLElement;
}

/** FE#73 (bənd 5) — müştəri adının BÜTÖVÜ kliklənəndir → CustomerDrawer açır. */
describe("CustomersTable — ad kliki (FE#73 bənd 5)", () => {
  it("ad sahəsinə klik onView-i çağırır", async () => {
    const onView = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <CustomersTable
        customers={[makeCustomer()]}
        variant="all"
        onView={onView}
        onPay={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    await user.click(
      within(table).getByRole("button", {
        name: "Elvin Məmmədov — müştəri detalına bax",
      }),
    );
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ id: "c1" }));
  });
});

/** FE#73 (bənd 7) — sətir səviyyəsində "Ödəniş" → "Borc ödənişi al". */
describe("CustomersTable — 'Borc ödənişi al' etiketi (FE#73 bənd 7)", () => {
  it("sətir əməliyyatı düyməsi 'Borc ödənişi al' mətni ilə göstərilir (aria-label + tooltip)", () => {
    const { container } = render(
      <CustomersTable
        customers={[makeCustomer()]}
        variant="all"
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    const btn = within(table).getByRole("button", {
      name: "Elvin Məmmədov — borc ödənişi al",
    });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("title", "Elvin Məmmədov — borc ödənişi al");
    expect(within(table).queryByText("Ödəniş")).not.toBeInTheDocument();
  });

  it("klik onPay-i çağırır", async () => {
    const onPay = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <CustomersTable
        customers={[makeCustomer()]}
        variant="all"
        onView={vi.fn()}
        onPay={onPay}
      />,
    );
    const table = desktopTable(container);
    await user.click(
      within(table).getByRole("button", {
        name: "Elvin Məmmədov — borc ödənişi al",
      }),
    );
    expect(onPay).toHaveBeenCalledWith(expect.objectContaining({ id: "c1" }));
  });
});

/** FE#73 (bənd 9/10) — borc rənginin qaydası: normal ≠ qırmızı, gecikmiş/kritik fərqli badge. */
describe("CustomersTable — borc rəngi/badge qaydası (FE#73 bənd 9/10)", () => {
  it("adi borclu (60 gündən az) 'Borclu' badge göstərir, rəqəm QIRMIZI DEYİL", () => {
    const { container } = render(
      <CustomersTable
        customers={[makeCustomer({ lastPaymentDate: daysAgoISO(5) })]}
        variant="all"
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    expect(within(table).getByText("Borclu")).toBeInTheDocument();
    const amount = within(table).getByText("200.00 ₼");
    expect(amount).not.toHaveClass("text-red-600");
  });

  it("60+ gün hərəkətsiz borclu 'Gecikmiş borc' badge göstərir", () => {
    const { container } = render(
      <CustomersTable
        customers={[
          makeCustomer({
            lastPaymentDate: daysAgoISO(70),
            lastPurchaseDate: daysAgoISO(70),
          }),
        ]}
        variant="all"
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(
      within(desktopTable(container)).getByText("Gecikmiş borc"),
    ).toBeInTheDocument();
  });

  it("120+ gün hərəkətsiz borclu 'Kritik borc' badge göstərir (qırmızı YALNIZ bu halda)", () => {
    const { container } = render(
      <CustomersTable
        customers={[
          makeCustomer({
            lastPaymentDate: daysAgoISO(150),
            lastPurchaseDate: daysAgoISO(150),
          }),
        ]}
        variant="all"
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(
      within(desktopTable(container)).getByText("Kritik borc"),
    ).toBeInTheDocument();
  });

  it("borcu 0 olan müştəri '0.00 ₼' göstərir, '—' YOX (sıfır ilə mövcud olmayan fərqlənir)", () => {
    const { container } = render(
      <CustomersTable
        customers={[makeCustomer({ remainingDebt: 0 })]}
        variant="all"
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(
      within(desktopTable(container)).getByText("0.00 ₼"),
    ).toBeInTheDocument();
  });

  it("'debtors' variantında (Nisyə Borclar → Müştəri üzrə) Status sütununda eyni tonlu badge görünür, Qalıq borc sütununda TƏKRARLANMIR", () => {
    const { container } = render(
      <CustomersTable
        customers={[
          makeCustomer({
            lastPaymentDate: daysAgoISO(150),
            lastPurchaseDate: daysAgoISO(150),
          }),
        ]}
        variant="debtors"
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    // Desktop cədvəldə (mobil kartdan ayrı) YALNIZ BİR "Kritik borc" görünür
    // (Status sütunundan) — Qalıq borc sütununda təkrar badge yoxdur.
    const table = desktopTable(container);
    expect(within(table).getAllByText("Kritik borc")).toHaveLength(1);
  });
});
