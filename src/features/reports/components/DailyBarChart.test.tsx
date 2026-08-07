import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DailyBarChart } from "./DailyBarChart";
import type { DailyPoint } from "../lib";

const point = (overrides: Partial<DailyPoint>): DailyPoint => ({
  date: "01.08",
  fullDateIso: "2026-08-01",
  satis: 0,
  qazanc: 0,
  ...overrides,
});

describe("DailyBarChart — FE#78", () => {
  it("bənd #11: 2-dən az qeyri-sıfır nöqtə → seyrək data mesajı, chart YOX", () => {
    const data = [point({ satis: 100, qazanc: 20 }), point({}), point({})];
    render(<DailyBarChart data={data} showProfit />);
    expect(
      screen.getByText("Bu dövrdə kifayət qədər məlumat yoxdur"),
    ).toBeInTheDocument();
  });

  it("2+ qeyri-sıfır nöqtə → normal chart + 'Cədvəl kimi bax' əlçatan cədvəl (bənd #12)", () => {
    const data = [
      point({ satis: 100, qazanc: 20 }),
      point({ date: "02.08", fullDateIso: "2026-08-02", satis: 50, qazanc: 10 }),
    ];
    render(<DailyBarChart data={data} showProfit />);
    expect(
      screen.queryByText("Bu dövrdə kifayət qədər məlumat yoxdur"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Cədvəl kimi bax")).toBeInTheDocument();
    // Cədvəldə tam tarix (il daxil) göstərilir — ox etiketindən fərqli olaraq.
    expect(screen.getByText("01.08.2026")).toBeInTheDocument();
  });
});
