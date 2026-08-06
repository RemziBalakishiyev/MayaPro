import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpenseFilters } from "./ExpenseFilters";
import { useExpenseTypes } from "@/features/expense-types/queries";

/**
 * FE#76 (AC-3/AC-4) — axtarış `TableToolbar` + `LocalTableSearch` cütü ilə
 * (Mallar/Təchizatçılar/Müştərilər naxışı), mənbə/xərc növü filtrləri isə
 * "Filterlər" toqql panelində. `useExpenseTypes` (react-query) real
 * QueryClientProvider tələb etmədən mock edilir (`SalesJournal.test.tsx`-dəki
 * eyni naxış).
 */
vi.mock("@/features/expense-types/queries", () => ({
  useExpenseTypes: vi.fn(),
}));

const mockUseExpenseTypes = vi.mocked(useExpenseTypes);

describe("ExpenseFilters", () => {
  beforeEach(() => {
    mockUseExpenseTypes.mockReturnValue({
      data: [{ id: "t1", name: "Nəqliyyat" }],
      // Digər react-query sahələri bu testlərdə istifadə olunmur.
    } as unknown as ReturnType<typeof useExpenseTypes>);
  });

  it("axtarış TableToolbar daxilindəki LocalTableSearch-dədir (AC-3)", () => {
    render(
      <ExpenseFilters value={{ source: "all" }} onChange={vi.fn()} />,
    );
    expect(
      screen.getByRole("textbox", { name: "Xərc siyahısında axtar" }),
    ).toBeInTheDocument();
  });

  it("aktiv filtr sayı 'Filterlər' düyməsində bədge kimi görünür (mənbə seçilib)", () => {
    render(
      <ExpenseFilters value={{ source: "product" }} onChange={vi.fn()} />,
    );
    const toggle = screen.getByRole("button", { name: /^Filterlər(\s|$)/ });
    expect(toggle).toHaveTextContent("1");
  });

  it("heç bir filtr seçilməyəndə sayğac görünmür", () => {
    render(<ExpenseFilters value={{ source: "all" }} onChange={vi.fn()} />);
    const toggle = screen.getByRole("button", { name: /^Filterlər(\s|$)/ });
    expect(toggle.textContent).not.toMatch(/[1-9]/);
  });

  it("mənbə seçimi 'Mala bağlı' aktiv filtr çipi kimi görünür", () => {
    render(
      <ExpenseFilters value={{ source: "product" }} onChange={vi.fn()} />,
    );
    // Select-in gizli görünən trigger mətni + hidden <option> də eyni mətni
    // daşıyır — yalnız "sil" düyməli aktiv filtr çipini yoxlamaq üçün silmə
    // aria-label-ından tapılır.
    const removeBtn = screen.getByRole("button", { name: "Mala bağlı sil" });
    expect(removeBtn).toBeInTheDocument();
  });
});
