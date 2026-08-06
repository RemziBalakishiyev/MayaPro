import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExpensesTable } from "./ExpensesTable";
import type { Expense, Product } from "@/types";

/**
 * FE#76 — `ExpensesTable`-in "Bağlı mal" sütunu `<Link>` (tanstack router)
 * istifadə edir; testlərdə tam router quraşdırmağa ehtiyac qalmasın deyə
 * (`ProductsTable.test.tsx`-dəki `useNavigate` mock naxışı ilə eyni məntiq)
 * `Link` sadə `<a>` stub-u ilə əvəzlənir — naviqasiyanın özü bu faylın
 * əhatəsi deyil, YALNIZ klik davranışı (stopPropagation) yoxlanılır.
 */
vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>(
      "@tanstack/react-router",
    );
  return {
    ...actual,
    Link: ({
      children,
      onClick,
      title,
      "aria-label": ariaLabel,
      className,
    }: {
      children: React.ReactNode;
      onClick?: (e: React.MouseEvent) => void;
      title?: string;
      "aria-label"?: string;
      className?: string;
    }) => (
      <a href="#" onClick={onClick} title={title} aria-label={ariaLabel} className={className}>
        {children}
      </a>
    ),
  };
});

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    title: "Kirayə",
    category: "İcarə",
    amount: 250,
    productId: null,
    date: "2026-08-01",
    note: "",
    source: "general",
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Kişi cins şalvar",
    category: "Geyim",
    attributes: [],
    barcode: "SDK1001",
    image: "",
    note: "",
    purchasePrice: 20,
    salePrice: 35,
    quantity: 12,
    initialQuantity: 20,
    minStock: 5,
    currency: "AZN",
    supplierId: "",
    location: "Anbar A",
    store: "",
    warehouse: "Anbar A",
    shelf: "",
    box: "",
    expenses: [],
    realCostPerUnit: 20,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function desktopTable(container: HTMLElement): HTMLElement {
  const table = container.querySelector("table");
  if (!table) throw new Error("Desktop <table> tapılmadı");
  return table as HTMLElement;
}

/**
 * `ExpenseAmount` görünən dəyəri `aria-label="Xərc məbləği: …"` olan `<span>`
 * daxilindədir (bax `amount-presentation.tsx`) — birbaşa DOM sorğusu ilə
 * tapılır ki, `fmtMoney`-nin qırılmaz boşluq (NBSP) simvolu RTL-in mətn
 * normalizasiya davranışından ASILI OLMASIN.
 */
function amountText(scope: HTMLElement): string {
  const el = scope.querySelector('[aria-label^="Xərc məbləği"]');
  if (!el) throw new Error("Məbləğ elementi tapılmadı");
  return el.textContent ?? "";
}

/** FE#76 (AC-5/AC-6/TC-10/TC-11): məbləğ NEYTRAL, İŞARƏSİZ, qırmızı YOX. */
describe("ExpensesTable — məbləğ təqdimatı (FE#76 AC-5/AC-6)", () => {
  it("cədvəl sətrində rəqəm işarəsizdir, qırmızı sinif YOXDUR, 'çıxış' konteksti var", () => {
    const { container } = render(
      <ExpensesTable
        expenses={[makeExpense({ amount: 123 })]}
        products={[]}
        onRowClick={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    const text = amountText(table);
    expect(text).toMatch(/^123\.00\s*.$/);
    expect(text.startsWith("-")).toBe(false);
    expect(text.startsWith("−")).toBe(false);
    expect(within(table).getAllByText("çıxış").length).toBeGreaterThan(0);
    // heç bir element text-red-600 sinfini daşımır
    expect(table.querySelectorAll(".text-red-600").length).toBe(0);
  });

  it("mobil kartda da eyni işarəsiz/neytral format tətbiq olunur", () => {
    const { container } = render(
      <ExpensesTable
        expenses={[makeExpense({ amount: 88.5 })]}
        products={[]}
        onRowClick={vi.fn()}
      />,
    );
    // Mobil kart eyni anda DOM-dadır (md:hidden CSS ilə gizlədilir, jsdom-da mövcuddur).
    const mobileWrap = container.querySelector(".md\\:hidden") as HTMLElement;
    expect(mobileWrap).toBeTruthy();
    const text = amountText(mobileWrap);
    expect(text).toMatch(/^88\.50\s*.$/);
    expect(mobileWrap.querySelectorAll(".text-red-600").length).toBe(0);
  });
});

/** FE#76 (AC-10): xərc növü/mənbə Badge ilə ardıcıl göstərilir. */
describe("ExpensesTable — Badge (FE#76 AC-10)", () => {
  it("Növ və Mənbə Badge kimi göstərilir", () => {
    const { container } = render(
      <ExpensesTable
        expenses={[makeExpense({ category: "Nəqliyyat", source: "general" })]}
        products={[]}
        onRowClick={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    expect(within(table).getByText("Nəqliyyat")).toBeInTheDocument();
    expect(within(table).getByText("Ümumi")).toBeInTheDocument();
  });

  it("mala bağlı xərcdə mənbə badge-i 'Mala bağlı' göstərir", () => {
    const { container } = render(
      <ExpensesTable
        expenses={[
          makeExpense({ source: "product", productId: "p1" }),
        ]}
        products={[makeProduct()]}
        onRowClick={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    expect(within(table).getByText("Mala bağlı")).toBeInTheDocument();
  });
});

/** FE#76 (AC-11/TC-18..20): bağlı mal kliklənən, drawer açılışını tetiklemir. */
describe("ExpensesTable — bağlı mal linki (FE#76 AC-11)", () => {
  it("mal mövcuddursa kliklənən keçid göstərir, klik onRowClick-i TETİKLEMİR", async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <ExpensesTable
        expenses={[makeExpense({ source: "product", productId: "p1" })]}
        products={[makeProduct({ id: "p1", name: "Kişi cins şalvar" })]}
        onRowClick={onRowClick}
      />,
    );
    const table = desktopTable(container);
    const link = within(table).getByRole("link", {
      name: "Kişi cins şalvar — mal detalına bax",
    });
    expect(link).toBeInTheDocument();
    await user.click(link);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("mal tapılmırsa (silinib) EmptyValue göstərir, xəta atılmır", () => {
    const { container } = render(
      <ExpensesTable
        expenses={[makeExpense({ source: "product", productId: "p-deleted" })]}
        products={[]}
        onRowClick={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    expect(within(table).getByText("mal tapılmadı")).toBeInTheDocument();
  });

  it("ümumi xərcdə (productId yoxdur) 'Ümumi xərc' mətni göstərir", () => {
    const { container } = render(
      <ExpensesTable
        expenses={[makeExpense({ source: "general", productId: null })]}
        products={[]}
        onRowClick={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    expect(within(table).getByText("Ümumi xərc")).toBeInTheDocument();
  });
});

/** FE#76 (AC-13/TC-21/TC-22): sətir əməliyyatları. */
describe("ExpensesTable — sətir əməliyyatları (FE#76 AC-13)", () => {
  it("canWrite=true olduqda 'Düzəliş et' düyməsi görünür, klik onEdit-i çağırır", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <ExpensesTable
        expenses={[makeExpense()]}
        products={[]}
        canWrite
        onEdit={onEdit}
        onDelete={vi.fn()}
        onRowClick={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    const btn = within(table).getByRole("button", { name: "Düzəliş et" });
    await user.click(btn);
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "e1" }));
  });

  it("canWrite=false olduqda əməliyyat sütunu render olunmur", () => {
    const { container } = render(
      <ExpensesTable
        expenses={[makeExpense()]}
        products={[]}
        canWrite={false}
        onRowClick={vi.fn()}
      />,
    );
    const table = desktopTable(container);
    expect(
      within(table).queryByRole("button", { name: /Düzəliş et/ }),
    ).not.toBeInTheDocument();
  });
});

/** FE#76 (AC-18/TC-28): şəbəkə xətası — standart InlineError + Yenidən. */
describe("ExpensesTable — şəbəkə xətası (FE#76 AC-18)", () => {
  it("isError=true olduqda InlineError göstərir, 'Xərc yoxdur' YOX", () => {
    render(
      <ExpensesTable
        expenses={[]}
        isError
        onRetry={vi.fn()}
        onRowClick={vi.fn()}
        products={[]}
      />,
    );
    expect(screen.getByText("Xərclər yüklənmədi")).toBeInTheDocument();
    expect(screen.queryByText("Xərc yoxdur")).not.toBeInTheDocument();
  });

  it("'Yenidən' düyməsinə klik onRetry-ni çağırır", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <ExpensesTable
        expenses={[]}
        isError
        onRetry={onRetry}
        onRowClick={vi.fn()}
        products={[]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
