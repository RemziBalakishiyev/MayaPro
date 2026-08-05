import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Trash2, X } from "lucide-react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

describe("Button", () => {
  it("variant və ölçü siniflərini tətbiq edir (primary/md defolt)", () => {
    render(<Button>Yadda saxla</Button>);
    const btn = screen.getByRole("button", { name: "Yadda saxla" });
    expect(btn.className).toContain("bg-emerald-700");
    expect(btn.className).toContain("min-h-[44px]");
    // Vahid fokus tokeni bütün düymələrdə (R-15)
    expect(btn.className).toContain("focus-ring");
  });

  /**
   * FE#84 (AC-8/TC-6) — design-system.md §1.6: heç bir interaktiv kontrol
   * 40px-dən kiçik olmamalıdır. "sm" ölçüsü ən kiçik Button variantı olduğu
   * üçün minimum hədd buradan qorunur.
   */
  it("'sm' ölçüsü ən azı 40px minimum hündürlüyə malikdir", () => {
    render(<Button size="sm">Detal</Button>);
    expect(screen.getByRole("button", { name: "Detal" })).toHaveClass(
      "min-h-[40px]",
    );
  });

  it("defolt ('md') ölçüsü də 40px-dən böyükdür", () => {
    render(<Button>Yadda saxla</Button>);
    expect(screen.getByRole("button", { name: "Yadda saxla" })).toHaveClass(
      "min-h-[44px]",
    );
  });

  it("bütün ölçülər ən azı 40px hündürlükdədir (AC-8)", () => {
    render(
      <>
        <Button size="sm">Kiçik</Button>
        <Button size="md">Orta</Button>
        <Button size="lg">Böyük</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Kiçik" }).className).toContain(
      "min-h-[40px]",
    );
    expect(screen.getByRole("button", { name: "Orta" }).className).toContain(
      "min-h-[44px]",
    );
    expect(screen.getByRole("button", { name: "Böyük" }).className).toContain(
      "min-h-[52px]",
    );
  });

  it("loading vəziyyətində deaktivdir, aria-busy verir və təkrar klik qəbul etmir (F-42)", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button loading onClick={onClick}>
        Göndər
      </Button>,
    );
    const btn = screen.getByRole("button", { name: /göndər/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("deaktiv düymədə səbəb `title` ilə oxunur", () => {
    render(
      <Button disabled title="Demo rejimdə əlçatan deyil">
        Excel export
      </Button>,
    );
    expect(screen.getByRole("button", { name: /excel export/i })).toHaveAttribute(
      "title",
      "Demo rejimdə əlçatan deyil",
    );
  });
});

describe("IconButton", () => {
  it("label-dan həm aria-label, həm tooltip qurur (AC-15)", () => {
    render(<IconButton label="Bağla" icon={<X size={18} />} />);
    const btn = screen.getByRole("button", { name: "Bağla" });
    expect(btn).toHaveAttribute("title", "Bağla");
    expect(btn).toHaveAttribute("aria-label", "Bağla");
  });

  it("tooltip propu verildikdə title ondan gəlir, aria-label label-dan qalır", () => {
    render(
      <IconButton
        label="Sil"
        tooltip="Sətri silmək üçün icazəniz yoxdur"
        icon={<Trash2 size={18} />}
        tone="danger"
        disabled
      />,
    );
    const btn = screen.getByRole("button", { name: "Sil" });
    expect(btn).toHaveAttribute("title", "Sətri silmək üçün icazəniz yoxdur");
    expect(btn).toBeDisabled();
  });

  it("toxunma hədəfi ≥40px-dir", () => {
    render(
      <>
        <IconButton label="Kiçik" size="sm" icon={<X size={16} />} />
        <IconButton label="Orta" size="md" icon={<X size={18} />} />
      </>,
    );
    expect(screen.getByRole("button", { name: "Kiçik" }).className).toContain(
      "h-10",
    );
    expect(screen.getByRole("button", { name: "Orta" }).className).toContain(
      "h-11",
    );
  });
});
