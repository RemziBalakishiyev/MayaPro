import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PeriodFilter } from "./PeriodFilter";
import {
  formatRangeChip,
  last12Months,
  monthRange,
  quickPeriodRange,
  type PeriodRange,
} from "./period-filter-lib";

/**
 * Testlər sistem tarixini fake etmir (userEvent-in daxili gözləmələri fake
 * timer ilə asılı qalır) — bunun əvəzinə gözlənilən dəyərlər eyni pure
 * funksiyalarla (`quickPeriodRange`/`monthRange`) DİNAMİK hesablanır ki,
 * test hansı gündə işə düşürsə düşsün nəticə düzgün qalsın.
 */

/** Nəzarət olunan (controlled) wrapper — PeriodFilter özü state saxlamır (URL mənbədir). */
function Controlled({
  initial = {},
  defaultKey,
}: {
  initial?: PeriodRange;
  defaultKey?: Parameters<typeof PeriodFilter>[0]["defaultKey"];
}) {
  const [value, setValue] = useState<PeriodRange>(initial);
  return (
    <PeriodFilter value={value} onChange={setValue} defaultKey={defaultKey} />
  );
}

describe("PeriodFilter", () => {
  it("TC1 — bütün hazır çipləri düzgün ardıcıllıqla göstərir, defolt 'Hamısı' aktivdir", () => {
    render(<Controlled />);
    const tabs = screen.getAllByRole("tab");
    const labels = tabs.map((t) => t.textContent);
    expect(labels[0]).toContain("Bu gün");
    expect(labels[1]).toContain("Bu həftə");
    expect(labels[2]).toContain("Bu ay");
    expect(labels[3]).toContain("Keçən ay");
    expect(labels[4]).toContain("Bu il");
    expect(labels[5]).toContain("Hamısı");
    expect(labels[6]).toContain("Tarix seç");

    expect(screen.getByRole("tab", { name: "Hamısı" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("AC3 — bir çipə klikləyəndə yalnız o aktiv olur", async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    await user.click(screen.getByRole("tab", { name: "Bu ay" }));

    expect(screen.getByRole("tab", { name: "Bu ay" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Hamısı" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("TC5 — Tarix seç popoverindən ay seçimi çipi 'DD.MM - DD.MM' formatına dəyişir", async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    // index 2 (iki ay öncə) qəsdən seçilir ki, "Bu ay"/"Keçən ay" hazır
    // çipləri ilə təsadüfən üst-üstə düşməsin (AC6 xüsusi çip görünüşünü test edir).
    const secondMonth = last12Months()[2];
    const expectedRange = monthRange(secondMonth.ym);
    const expectedChip = formatRangeChip(
      expectedRange.from as string,
      expectedRange.to as string,
    );

    await user.click(screen.getByRole("tab", { name: /Tarix seç/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByText(secondMonth.label));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: new RegExp(expectedChip.replace(/\./g, "\\.")) }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("TC6/TC7 — sərbəst aralıq: doğru aralıq tətbiq olunur, başlanğıc > son xəta verir", async () => {
    const user = userEvent.setup();
    render(<Controlled />);

    await user.click(screen.getByRole("tab", { name: /Tarix seç/ }));
    const dialog = await screen.findByRole("dialog");

    const startInput = within(dialog).getByLabelText("Başlanğıc tarix");
    const endInput = within(dialog).getByLabelText("Son tarix");

    // TC7 — invalid: başlanğıc > son
    await user.type(startInput, "2026-03-20");
    await user.type(endInput, "2026-03-05");
    await user.click(within(dialog).getByRole("button", { name: "Tətbiq et" }));

    expect(
      await within(dialog).findByText("Başlanğıc tarix son tarixdən sonra ola bilməz"),
    ).toBeInTheDocument();
    // Popover hələ açıqdır, çip dəyişməyib
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // TC6 — doğru aralıq
    await user.clear(startInput);
    await user.type(startInput, "2026-03-05");
    await user.clear(endInput);
    await user.type(endInput, "2026-03-20");
    await user.click(within(dialog).getByRole("button", { name: "Tətbiq et" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /05\.03 - 20\.03/ })).toBeInTheDocument();
  });

  it("TC8 — aktiv xüsusi aralığın 'x' işarəsi dövrü təmizləyir", async () => {
    const user = userEvent.setup();
    render(<Controlled initial={{ from: "2026-06-01", to: "2026-06-30" }} />);

    expect(screen.getByRole("tab", { name: /01\.06 - 30\.06/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.click(screen.getByLabelText("Tarix aralığını təmizlə"));

    expect(screen.getByRole("tab", { name: "Hamısı" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("TC9/AC10 — deep-link: verilmiş from/to ilə ilkin render aktiv aralığı göstərir", () => {
    render(<Controlled initial={{ from: "2026-06-01", to: "2026-06-30" }} />);
    expect(screen.getByRole("tab", { name: /01\.06 - 30\.06/ })).toBeInTheDocument();
  });

  it("AC2 — defaultKey verilibsə və URL-də from/to yoxdursa, ilk mount-da tətbiq olunur", () => {
    const onChange = vi.fn();
    render(<PeriodFilter value={{}} onChange={onChange} defaultKey="month" />);
    expect(onChange).toHaveBeenCalledWith(quickPeriodRange("month"));
  });

  it("AC4 — 'Hamısı' seçiləndə aktiv çip 'Hamısı'ya keçir", async () => {
    const user = userEvent.setup();
    render(<Controlled initial={quickPeriodRange("today")} />);

    await user.click(screen.getByRole("tab", { name: "Hamısı" }));

    expect(screen.getByRole("tab", { name: "Hamısı" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
