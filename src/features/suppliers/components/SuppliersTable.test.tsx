import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { daysAgoISO } from "@/lib/format";
import { SuppliersTable } from "./SuppliersTable";
import type { Supplier } from "@/types";

/**
 * `DataTable` desktop cədvəli VƏ mobil kartı EYNİ ANDA DOM-a render edir
 * (CSS `hidden md:block` / `md:hidden` ilə görünürlük idarə olunur — jsdom-da
 * hər ikisi mövcuddur). Ona görə sətir-səviyyəli assertlər desktop
 * `<table>`-ə `within(...)` ilə əhatələnir ki, "tapılan çox element" xətası
 * olmasın (bax `CustomersTable.test.tsx` — eyni naxış).
 */
function desktopTable(container: HTMLElement): HTMLElement {
  const table = container.querySelector("table");
  if (!table) throw new Error("Desktop <table> tapılmadı");
  return table as HTMLElement;
}

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: "s1",
    name: "Bakı Toptan A.Ş.",
    phone: "+994501234567",
    note: "",
    totalDebt: 500,
    paidAmount: 200,
    remainingDebt: 300,
    initialDebt: 0,
    itemCount: 4,
    lastPaymentDate: "",
    createdAt: daysAgoISO(10),
    ...overrides,
  };
}

/**
 * FE#87 (TC-32.5/32.6) — təchizatçı sorğusu şəbəkə xətası ilə uğursuz
 * olduqda "Hələ təchizatçı yoxdur" boş-siyahı mesajı ƏVƏZİNƏ `InlineError`
 * + "Yenidən" düyməsi göstərilməlidir.
 */
describe("SuppliersTable — şəbəkə xətası (FE#87)", () => {
  it("isError=true olduqda InlineError göstərir, 'Hələ təchizatçı yoxdur' YOX", () => {
    render(
      <SuppliersTable
        suppliers={[]}
        isError
        onRetry={vi.fn()}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Təchizatçılar yüklənmədi")).toBeInTheDocument();
    expect(
      screen.queryByText("Hələ təchizatçı yoxdur"),
    ).not.toBeInTheDocument();
  });

  it("'Yenidən' düyməsinə klik onRetry-ni çağırır", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <SuppliersTable
        suppliers={[]}
        isError
        onRetry={onRetry}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("isError=false və data=[] olduqda normal EmptyState göstərir (regressiya)", () => {
    render(
      <SuppliersTable
        suppliers={[]}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(screen.getByText("Hələ təchizatçı yoxdur")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

/** FE#75 — dizayn sisteminə keçid: ad kliki, "Bağlı mal sayı" etiketi/tooltip, */
describe("SuppliersTable — FE#75 dizayn sisteminə keçid", () => {
  it("təchizatçı adına klik onView-i çağırır (AC-7)", async () => {
    const onView = vi.fn();
    const user = userEvent.setup();
    const supplier = makeSupplier();
    const { container } = render(
      <SuppliersTable
        suppliers={[supplier]}
        onView={onView}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    await user.click(
      within(desktopTable(container)).getByRole("button", {
        name: /Bakı Toptan A\.Ş\. — təchizatçı detalına bax/i,
      }),
    );
    expect(onView).toHaveBeenCalledWith(supplier);
  });

  it("'Bağlı mal sayı' başlığı və tooltip mövcuddur (AC-5)", () => {
    render(
      <SuppliersTable
        suppliers={[makeSupplier()]}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    const headers = screen.getAllByRole("columnheader");
    const itemCountHeader = headers.find(
      (h) => h.textContent?.trim() === "Bağlı mal sayı",
    );
    expect(itemCountHeader).toBeTruthy();
    expect(
      itemCountHeader?.querySelector("[title]"),
    ).toHaveAttribute("title", "Bu təchizatçıdan alınan mallar");
  });

  it("'Təchizatçıya ödəniş et' etiketi göstərilir, klik onPay-ı çağırır (AC-6)", async () => {
    const onPay = vi.fn();
    const user = userEvent.setup();
    const supplier = makeSupplier();
    const { container } = render(
      <SuppliersTable
        suppliers={[supplier]}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={onPay}
      />,
    );
    const btn = within(desktopTable(container)).getByRole("button", {
      name: /Bakı Toptan A\.Ş\. — təchizatçıya ödəniş et/i,
    });
    expect(btn).toHaveTextContent("Təchizatçıya ödəniş et");
    await user.click(btn);
    expect(onPay).toHaveBeenCalledWith(supplier);
  });

  it("borc yoxdursa (0) badge göstərmir, qırmızı rəng yoxdur (AC-12)", () => {
    render(
      <SuppliersTable
        suppliers={[makeSupplier({ remainingDebt: 0 })]}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(screen.queryByText("Borclu")).not.toBeInTheDocument();
    expect(screen.queryByText("Kritik borc")).not.toBeInTheDocument();
  });

  it("adi borc (60 gündən az) 'Borclu' badge göstərir, 'Kritik borc' YOX", () => {
    const { container } = render(
      <SuppliersTable
        suppliers={[
          makeSupplier({
            remainingDebt: 150,
            lastPaymentDate: daysAgoISO(5),
          }),
        ]}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    expect(within(table).getByText("Borclu")).toBeInTheDocument();
    expect(within(table).queryByText("Kritik borc")).not.toBeInTheDocument();
  });

  it("kritik borc (120+ gün) 'Kritik borc' badge göstərir", () => {
    const { container } = render(
      <SuppliersTable
        suppliers={[
          makeSupplier({
            remainingDebt: 150,
            lastPaymentDate: daysAgoISO(130),
          }),
        ]}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(
      within(desktopTable(container)).getByText("Kritik borc"),
    ).toBeInTheDocument();
  });

  it("son ödəniş tarixi yoxdursa EmptyValue ('—') göstərir", () => {
    render(
      <SuppliersTable
        suppliers={[makeSupplier({ lastPaymentDate: "" })]}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("axtarış/seqment nəticəsiz olduqda xüsusi emptyState mesajı göstərilir", () => {
    render(
      <SuppliersTable
        suppliers={[]}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
        emptyState={{
          title: "Filterə uyğun təchizatçı yoxdur",
          description: "Axtarışı və ya «Borcum olanlar» görünüşünü dəyişin.",
        }}
      />,
    );
    expect(
      screen.getByText("Filterə uyğun təchizatçı yoxdur"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Hələ təchizatçı yoxdur"),
    ).not.toBeInTheDocument();
  });
});
