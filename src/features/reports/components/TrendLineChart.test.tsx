import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrendLineChart } from "./TrendLineChart";

describe("TrendLineChart — FE#78", () => {
  it("bənd #11: 2-dən az qeyri-sıfır nöqtə → seyrək data mesajı", () => {
    const data = [
      { label: "28.07 – 03.08", qazanc: 0 },
      { label: "04.08 – 10.08", qazanc: 0 },
      { label: "11.08 – 17.08", qazanc: 15 },
    ];
    render(<TrendLineChart data={data} xKey="label" wideLabels />);
    expect(
      screen.getByText("Bu dövrdə kifayət qədər məlumat yoxdur"),
    ).toBeInTheDocument();
  });

  it("bənd #6: real tarix aralığı etiketləri ilə render olunur, 'Cədvəl kimi bax' göstərir", () => {
    const data = [
      { label: "28.07 – 03.08", qazanc: 40 },
      { label: "04.08 – 10.08", qazanc: 60 },
    ];
    render(<TrendLineChart data={data} xKey="label" wideLabels />);
    expect(
      screen.queryByText("Bu dövrdə kifayət qədər məlumat yoxdur"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Cədvəl kimi bax")).toBeInTheDocument();
    // Etiket həm X ox tick-ində, həm də əlçatan cədvəldə görünür.
    expect(screen.getAllByText("28.07 – 03.08").length).toBeGreaterThan(0);
  });
});
