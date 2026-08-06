import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProductsTable } from "./ProductsTable";
import type { Product } from "@/types";

// FE#70 — sətir əməliyyatları (`ProductRowActions`) `useNavigate()` istifadə
// edir ("Digər" menyusundaki "Detal" bəndi). Router provider-siz mühitdə
// hook çağırışı xəta atır, ona görə yalnız bu funksiya mock edilir —
// naviqasiya davranışının özü bu fayldakı testlərin əhatəsi deyil.
vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>(
      "@tanstack/react-router",
    );
  return { ...actual, useNavigate: () => vi.fn() };
});

const baseProduct: Product = {
  id: "p1",
  name: "Kişi cins şalvar",
  category: "Geyim",
  attributes: [{ name: "Ölçü", value: "M" }],
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
};

/**
 * FE#87 (TC-32.1/32.2) — mal sorğusu şəbəkə xətası ilə uğursuz olduqda
 * "Mal tapılmadı" boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən"
 * düyməsi göstərilməlidir; `onRetry` `useProducts().refetch`-ə bağlanmalıdır.
 */
describe("ProductsTable — şəbəkə xətası (FE#87)", () => {
  it("isError=true olduqda InlineError göstərir, 'Mal tapılmadı' YOX", () => {
    render(
      <ProductsTable
        products={[]}
        isError
        onRetry={vi.fn()}
        onEdit={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Mallar yüklənmədi")).toBeInTheDocument();
    expect(screen.queryByText("Mal tapılmadı")).not.toBeInTheDocument();
  });

  it("'Yenidən' düyməsinə klik onRetry-ni çağırır (TC-32.2)", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <ProductsTable
        products={[]}
        isError
        onRetry={onRetry}
        onEdit={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("isError=false və data=[] olduqda normal EmptyState göstərir (TC-32.13 regressiya)", () => {
    render(
      <ProductsTable products={[]} onEdit={vi.fn()} onAdjust={vi.fn()} />,
    );
    expect(screen.getByText("Mal tapılmadı")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("çağıran tərəf `emptyState` ötürsə, o istifadə olunur (TC-28)", () => {
    render(
      <ProductsTable
        products={[]}
        onEdit={vi.fn()}
        onAdjust={vi.fn()}
        emptyState={{ title: "Filterə uyğun mal yoxdur" }}
      />,
    );
    expect(screen.getByText("Filterə uyğun mal yoxdur")).toBeInTheDocument();
    expect(screen.queryByText("Mal tapılmadı")).not.toBeInTheDocument();
  });
});

/**
 * FE#70 (AC-16/TC-24) — mal adı xanasının bütövü (ikon + ad + alt mətn)
 * klikləniəndir və `onEdit`-i çağırır; ayrıca detal SƏHİFƏSİNƏ keçid YOXDUR
 * (`<Link to="/mallar/$id">` silinib, `<button onClick={onEdit}>` ilə əvəzlənib).
 */
describe("ProductsTable — mal adı klik (FE#70 AC-16)", () => {
  it("mal adına klik onEdit-i həmin malla çağırır", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(
      <ProductsTable
        products={[baseProduct]}
        onEdit={onEdit}
        onAdjust={vi.fn()}
      />,
    );
    // DataTable eyni anda həm desktop cədvəl, həm mobil kart markup-unu
    // render edir (CSS ilə responsiv gizlədilir) — hər ikisində ad sahəsi
    // eyni aria-label ilə klikləniəndir, ona görə `getAllByRole` istifadə
    // olunur.
    const nameButtons = screen.getAllByRole("button", {
      name: /Kişi cins şalvar — redaktə et/,
    });
    expect(nameButtons.length).toBeGreaterThan(0);
    await user.click(nameButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(baseProduct);
  });

  it("mal adı sahəsi keçid linki DEYİL (heç bir 'link' rolu yoxdur)", () => {
    render(
      <ProductsTable
        products={[baseProduct]}
        onEdit={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});

/** FE#70 (AC-13/TC-20) — sətrin əsas əməliyyatı mətnli düymədir. */
describe("ProductsTable — Stok artır düyməsi (FE#70 AC-13)", () => {
  it("'Stok artır' mətnli düymə görünür və klik onAdjust(product,'add')-i çağırır", async () => {
    const onAdjust = vi.fn();
    const user = userEvent.setup();
    render(
      <ProductsTable
        products={[baseProduct]}
        onEdit={vi.fn()}
        onAdjust={onAdjust}
      />,
    );
    // Desktop cədvəl + mobil kart eyni anda render olunur (bax yuxarıdaki
    // qeyd) — hər ikisində "Stok artır" mətnli düymə var.
    const buttons = screen.getAllByRole("button", { name: "Stok artır" });
    expect(buttons.length).toBeGreaterThan(0);
    await user.click(buttons[0]);
    expect(onAdjust).toHaveBeenCalledWith(baseProduct, "add");
  });
});

/** FE#70 (AC-8/AC-9/TC-13/TC-15/TC-17) — sütun başlıqları və boş dəyər izahı. */
describe("ProductsTable — başlıq tooltip-ləri və boş dəyər (FE#70)", () => {
  it("'Qazanc %' başlığı 'Maya üzərindən qazanc %' + tooltip mətni ilə göstərilir", () => {
    render(
      <ProductsTable
        products={[baseProduct]}
        onEdit={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    const header = screen.getByText("Maya üzərindən qazanc %");
    expect(header.closest("span[title]")).toHaveAttribute(
      "title",
      "Satış qiyməti ilə real maya arasındakı fərqin mayaya nisbəti",
    );
  });

  it("alış = real maya olan malda Alış xanasında '—' + izah görünür (AC-9)", () => {
    render(
      <ProductsTable
        products={[baseProduct]}
        onEdit={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Xərc yoxdur — maya alışa bərabərdir", {
        selector: "span.sr-only",
      }),
    ).toBeInTheDocument();
  });

  it("kateqoriyası boş olan malda '—' + əlçatan izah göstərilir (AC-10)", () => {
    render(
      <ProductsTable
        products={[{ ...baseProduct, category: "" }]}
        onEdit={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Kateqoriya təyin edilməyib", {
        selector: "span.sr-only",
      }),
    ).toBeInTheDocument();
  });
});
