import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "./FilterBar";

/** FE#62 — axtarış + Filterlər + əlavə əməliyyatlar (məs. PDF) eyni sətirdə. */
describe("FilterBar", () => {
  it("actions slotu Filterlər düyməsi ilə eyni üst sətirdə render olunur", () => {
    render(
      <FilterBar
        searchValue=""
        onSearchChange={vi.fn()}
        activeCount={0}
        actions={<button type="button">PDF hesabat</button>}
      />,
    );
    const search = screen.getByRole("textbox");
    const filtersBtn = screen.getByRole("button", { name: /Filterlər/ });
    const pdfBtn = screen.getByRole("button", { name: "PDF hesabat" });
    // Hamısı eyni valideynin (üst sətir) uşaqlarıdır.
    expect(search.parentElement?.parentElement).toBe(filtersBtn.parentElement);
    expect(filtersBtn.parentElement).toBe(pdfBtn.parentElement);
  });

  it("actions verilməzsə əlavə heç nə render olunmur", () => {
    render(
      <FilterBar searchValue="" onSearchChange={vi.fn()} activeCount={0} />,
    );
    expect(screen.queryByText("PDF hesabat")).not.toBeInTheDocument();
  });
});
