import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductFilters } from "./ProductFilters";

/**
 * FE#70 (AC-6) — lokal cədvəl axtarışının placeholder-i tələb olunan hərfi
 * mətnə uyğunlaşdırılıb: "Bu siyahıda mal adı, kateqoriya və xüsusiyyət üzrə
 * axtar" (əvvəlki generic "Bu siyahıda axtar..." FE#85-dən qalıb, indi
 * Mallar səhifəsinə xas dəqiq mətnlə əvəzlənib).
 */
describe("ProductFilters", () => {
  it("axtarış inputunun placeholder-i AC-6 mətni ilə hərfi eynidir", () => {
    render(
      <ProductFilters
        value={{}}
        categories={[]}
        locations={[]}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByPlaceholderText(
        "Bu siyahıda mal adı, kateqoriya və xüsusiyyət üzrə axtar",
      ),
    ).toBeInTheDocument();
  });

  it("axtarış TableToolbar daxilindədir (AC-5)", () => {
    render(
      <ProductFilters
        value={{}}
        categories={[]}
        locations={[]}
        onChange={vi.fn()}
      />,
    );
    const input = screen.getByRole("textbox", {
      name: "Mal siyahısında axtar",
    });
    expect(input).toBeInTheDocument();
  });

  it("aktiv filtr sayı 'Filterlər' düyməsində bədge kimi görünür (AC-7)", () => {
    render(
      <ProductFilters
        value={{ cat: "Geyim", status: "Azalır" }}
        categories={["Geyim"]}
        locations={[]}
        onChange={vi.fn()}
      />,
    );
    // "Filterlər" (toggle) və "Filterləri təmizlə" (aktiv olduqda görünən
    // təmizləmə düyməsi) fərqli düymələrdir — dəqiq prefiks regex-i ilə
    // yalnız toggle düyməsi seçilir.
    const toggle = screen.getByRole("button", { name: /^Filterlər(\s|$)/ });
    expect(toggle).toHaveTextContent("2");
  });

  it("heç bir filtr seçilməyəndə sayğac görünmür (AC-7 edge)", () => {
    render(
      <ProductFilters
        value={{}}
        categories={[]}
        locations={[]}
        onChange={vi.fn()}
      />,
    );
    const toggle = screen.getByRole("button", { name: /^Filterlər(\s|$)/ });
    expect(toggle.textContent).not.toMatch(/[1-9]/);
  });
});
