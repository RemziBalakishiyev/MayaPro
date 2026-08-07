import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartDataTable } from "./ChartDataTable";

/** FE#78 (bənd #12) — hər chartın altında əlçatan cədvəl alternativi. */
describe("ChartDataTable", () => {
  it("boş rows-da heç nə render etmir", () => {
    const { container } = render(
      <ChartDataTable caption="Test" columns={[{ key: "a", label: "A" }]} rows={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("'Cədvəl kimi bax' başlığı və ötürülən sətirləri göstərir", () => {
    render(
      <ChartDataTable
        caption="Günlük satış cədvəli"
        columns={[
          { key: "date", label: "Tarix" },
          { key: "satis", label: "Satış", numeric: true },
        ]}
        rows={[
          { date: "01.08.2026", satis: "100.00 ₼" },
          { date: "02.08.2026", satis: "50.00 ₼" },
        ]}
      />,
    );
    expect(screen.getByText("Cədvəl kimi bax")).toBeInTheDocument();
    expect(screen.getByText("Tarix")).toBeInTheDocument();
    expect(screen.getByText("Satış")).toBeInTheDocument();
    expect(screen.getByText("01.08.2026")).toBeInTheDocument();
    expect(screen.getByText("02.08.2026")).toBeInTheDocument();
  });

  it("ekran oxuyucusu üçün sr-only caption ötürür", () => {
    render(
      <ChartDataTable
        caption="Xərc kateqoriyaları cədvəli"
        columns={[{ key: "name", label: "Ad" }]}
        rows={[{ name: "Kirayə" }]}
      />,
    );
    expect(screen.getByText("Xərc kateqoriyaları cədvəli")).toBeInTheDocument();
  });
});
