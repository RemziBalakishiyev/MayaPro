import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DebtViewToggle } from "./DebtViewToggle";

/**
 * FE#74 (AC1/AC2/AC3, TC1-TC3) — 2 böyük radio-kart ƏVƏZİNƏ BİR sətirlik
 * seqment kontrolu; izah mətni seqmentin altında TƏK kiçik sətirdə.
 */
describe("DebtViewToggle", () => {
  it("TC1 — iki böyük kart yoxdur, 1 seqment kontrolu görünür, 'Borclar' aktivdir", () => {
    render(<DebtViewToggle value="borclar" onChange={vi.fn()} />);
    const group = screen.getByRole("radiogroup");
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(group).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /borclar/i }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("radio", { name: /müştəri üzrə/i }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("AC3 — izah mətni seqmentin altında TƏK sətirdədir, seçilən rejimə görə dəyişir", () => {
    const { rerender } = render(
      <DebtViewToggle value="borclar" onChange={vi.fn()} />,
    );
    expect(
      screen.getByText(/hər açıq borc mənbəyi ayrı sətirdə/i),
    ).toBeInTheDocument();

    rerender(<DebtViewToggle value="musteri" onChange={vi.fn()} />);
    expect(
      screen.getByText(/hər müştərinin cəmi qalıq borcu/i),
    ).toBeInTheDocument();
  });

  it("TC2 — 'Müştəri üzrə'yə klik onChange('musteri') çağırır", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DebtViewToggle value="borclar" onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: /müştəri üzrə/i }));
    expect(onChange).toHaveBeenCalledWith("musteri");
  });

  it("TC3 — ArrowRight seqmentlər arasında dövr edir (move())", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DebtViewToggle value="borclar" onChange={onChange} />);
    const borclarRadio = screen.getByRole("radio", { name: /^borclar$/i });
    borclarRadio.focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("musteri");
  });

  it("TC3 — ArrowLeft 'musteri'dən 'borclar'a dövr edir (move())", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DebtViewToggle value="musteri" onChange={onChange} />);
    const musteriRadio = screen.getByRole("radio", { name: /müştəri üzrə/i });
    musteriRadio.focus();
    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenCalledWith("borclar");
  });
});
