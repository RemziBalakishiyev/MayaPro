import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CopyablePhone } from "./CopyablePhone";

/**
 * FE#63 — telefonu olmayan müştəri sətrində "—" əvəzinə heç nə göstərilmir.
 */
describe("CopyablePhone", () => {
  it("telefon boşdursa heç nə render etmir (dash yoxdur)", () => {
    const { container } = render(<CopyablePhone phone="" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });

  it("telefon mövcuddursa zəng düyməsi + formatlanmış nömrəni göstərir", () => {
    render(<CopyablePhone phone="0501234567" />);
    expect(screen.getByText("+994 50 123 45 67")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /zəng et/i })).toBeInTheDocument();
  });

  // FE#84 (AC-8/TC-6) — kopyalama düyməsi ən azı 40px toxunma hədəfinə malik olmalıdır.
  it("kopyalama düyməsi min-h-[40px] toxunma hədəfi class-ına malikdir", () => {
    render(<CopyablePhone phone="0501234567" />);
    const copyBtn = screen.getByRole("button", { name: /kopyala/i });
    expect(copyBtn).toHaveClass("min-h-[40px]");
  });
});
