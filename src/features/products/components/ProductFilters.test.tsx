import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductFilters } from "./ProductFilters";

/**
 * FE#85 — lokal cədvəl axtarışının placeholder-i qlobal (topbar) axtarışdan
 * fərqli olmalıdır: "Bu siyahıda axtar..." (səhifəyə xas xüsusi mətn silinib).
 */
describe("ProductFilters", () => {
  it("axtarış inputunun placeholder-i 'Bu siyahıda axtar...'-dır", () => {
    render(
      <ProductFilters
        value={{}}
        categories={[]}
        locations={[]}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByPlaceholderText("Bu siyahıda axtar..."),
    ).toBeInTheDocument();
  });
});
