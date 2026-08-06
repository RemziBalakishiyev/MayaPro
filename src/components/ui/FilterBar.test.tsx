import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "./FilterBar";

/**
 * FE#99 — aktiv filter çipinin "X sil" düyməsi və "Filterləri təmizlə"
 * düyməsi minimum 40x40px toxunma sahəsinə malik olmalıdır
 * (design-system.md §1.6, AC-8/TC-6). happy-dom real layout engine
 * olmadığı üçün faktiki piksel ölçüsünü ölçmək mümkün deyil — burada
 * toxunma hədəfini təmin edən Tailwind class-larının (40px-ə bərabər
 * olan `inset-[-12px]` / `h-4 w-4` cütü və `min-h-[40px]`) mövcudluğu
 * və funksionallığın qorunduğu yoxlanılır.
 */
describe("FilterBar — 40px toxunma hədəfi (FE#99)", () => {
  it("çip 'X sil' düyməsi 40x40px hit-slop (inset-[-12px] + h-4 w-4 lövbər) istifadə edir", () => {
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
    expect(removeBtn.className).toContain("inset-[-12px]");

    // Lövbər span: h-4 (16px) + 2*12px (inset) = 40px toxunma sahəsi.
    const anchor = removeBtn.parentElement;
    expect(anchor?.className).toContain("h-4");
    expect(anchor?.className).toContain("w-4");
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

  it("'Filterləri təmizlə' düyməsi min-h-[40px] daşıyır və kliklənəndə onClear çağrılır", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <FilterBar
        searchValue=""
        onSearchChange={() => {}}
        activeCount={1}
        activeFilters={[{ id: "f1", label: "Kateqoriya: Ət" }]}
        onClear={onClear}
      />,
    );

    const clearBtn = screen.getByRole("button", { name: "Filterləri təmizlə" });
    expect(clearBtn.className).toContain("min-h-[40px]");

    await user.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
