import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmployeesViewToggle } from "./EmployeesViewToggle";

/**
 * FE#79 (AC-1) — "İşçilər" səhifəsinin rejim seçimi `role="tablist"` /
 * `role="tab"` / `aria-selected` semantikasında, `DebtViewToggle` ilə eyni
 * seqmentli vizual/interaktiv naxışda (ox düymələri ilə keçid daxil).
 */
describe("EmployeesViewToggle", () => {
  it("2 tab render olunur, 'Maaşlar' aktivdir", () => {
    render(<EmployeesViewToggle value="maaslar" onChange={vi.fn()} />);
    const tablist = screen.getByRole("tablist");
    const tabs = screen.getAllByRole("tab");
    expect(tablist).toBeInTheDocument();
    expect(tabs).toHaveLength(2);
    expect(screen.getByRole("tab", { name: /maaşlar/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: /fəaliyyət/i })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("'Fəaliyyət'ə klik onChange('faaliyyet') çağırır", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<EmployeesViewToggle value="maaslar" onChange={onChange} />);
    await user.click(screen.getByRole("tab", { name: /fəaliyyət/i }));
    expect(onChange).toHaveBeenCalledWith("faaliyyet");
  });

  it("ArrowRight seqmentlər arasında dövr edir", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<EmployeesViewToggle value="maaslar" onChange={onChange} />);
    screen.getByRole("tab", { name: /maaşlar/i }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("faaliyyet");
  });

  it("ArrowLeft 'faaliyyet'dən 'maaslar'a dövr edir", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<EmployeesViewToggle value="faaliyyet" onChange={onChange} />);
    screen.getByRole("tab", { name: /fəaliyyət/i }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenCalledWith("maaslar");
  });
});
