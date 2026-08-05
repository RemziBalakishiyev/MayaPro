import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "./FilterBar";

/**
 * FE#125 — aktiv filter çipinin "X sil" düyməsi minimum 40x40px toxunma
 * sahəsinə malik olmalıdır (design-system.md §1.6, AC-8/TC-6). happy-dom
 * real layout engine olmadığı üçün faktiki piksel ölçüsünü ölçmək mümkün
 * deyil — burada toxunma hədəfini təmin edən Tailwind class-larının
 * (`absolute inset-[-8px]` 40x40px hit-slop) mövcudluğu və funksionallığın
 * qorunduğu yoxlanılır.
 */
describe("FilterBar — 40px toxunma hədəfi (FE#125)", () => {
  it("çip 'X sil' düyməsi absolute inset-[-8px] hit-slop ilə 40x40px toxunma sahəsi yaradır", () => {
    render(
      <FilterBar
        searchValue=""
        onSearchChange={() => {}}
        activeCount={1}
        activeFilters={[{ id: "f1", label: "Kateqoriya: Ət" }]}
        onRemoveFilter={() => {}}
      />,
    );

    const removeBtn = screen.getByRole("button", {
      name: "Kateqoriya: Ət sil",
    });
    expect(removeBtn.className).toContain("absolute");
    expect(removeBtn.className).toContain("inset-[-8px]");

    // Lövbər span: h-6 (24px) + 2*8px (inset) = 40px toxunma sahəsi.
    const anchor = removeBtn.parentElement;
    expect(anchor?.className).toContain("h-6");
    expect(anchor?.className).toContain("w-6");
  });

  it("çip 'X sil' düyməsinə kliklənəndə onRemoveFilter filter id ilə çağrılır", async () => {
    const user = userEvent.setup();
    const onRemoveFilter = vi.fn();
    render(
      <FilterBar
        searchValue=""
        onSearchChange={() => {}}
        activeCount={1}
        activeFilters={[{ id: "f1", label: "Kateqoriya: Ət" }]}
        onRemoveFilter={onRemoveFilter}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Kateqoriya: Ət sil" }));
    expect(onRemoveFilter).toHaveBeenCalledWith("f1");
  });
});
