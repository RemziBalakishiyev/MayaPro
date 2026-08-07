import { describe, expect, it } from "vitest";
import {
  dailySeries,
  weeklySeries,
  nonZeroCount,
  MIN_CHART_POINTS,
  REPORT_COLORS,
  paymentBreakdown,
} from "./lib";
import type { Expense, Sale } from "@/types";

const sale = (overrides: Partial<Sale>): Sale =>
  ({
    id: "s1",
    productId: "p1",
    productName: "Mal",
    quantity: 1,
    totalAmount: 100,
    profit: 20,
    paymentType: "Nağd",
    paidVia: "Nağd",
    paidAmount: 100,
    remainingAmount: 0,
    createdAt: "2026-08-01T10:00:00.000Z",
    employeeId: "e1",
    ...overrides,
  }) as Sale;

const expense = (overrides: Partial<Expense>): Expense =>
  ({
    id: "e1",
    title: "Xərc",
    category: "Kirayə",
    amount: 10,
    productId: null,
    date: "2026-08-01",
    note: "",
    source: "general",
    ...overrides,
  }) as Expense;

describe("weeklySeries — FE#78 bənd #6 (real tarix aralığı etiketi)", () => {
  it("hər nöqtə üçün 'dd.MM – dd.MM' formatında oxunan `label` qaytarır ('H1'/'H2' YOXDUR)", () => {
    const points = weeklySeries([], 3);
    expect(points).toHaveLength(3);
    for (const p of points) {
      expect(p.label).toMatch(/^\d{2}\.\d{2} – \d{2}\.\d{2}$/);
      expect(p.label).not.toMatch(/^H\d/);
    }
  });

  it("qazanc dəyəri dövrün satışlarından hesablanır — etiket formatı DƏYİŞSƏ də dəyər eyni qalır", () => {
    const sales = [sale({ profit: 50 }), sale({ profit: 30 })];
    const points = weeklySeries(sales, 1);
    expect(points[0].qazanc).toBe(80);
  });
});

describe("dailySeries — tooltip üçün tam tarix (fullDateIso)", () => {
  it("qısa ox etiketi ilə yanaşı tam ISO tarixi də qaytarır", () => {
    const points = dailySeries([], 2);
    for (const p of points) {
      expect(p.fullDateIso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Ox etiketi "dd.MM" formatındadır (il yazılmır).
      expect(p.date).toMatch(/^\d{2}\.\d{2}$/);
    }
  });
});

describe("dailySeries — FE#78 bənd #9 (tooltip 'xərc' sahəsi)", () => {
  it("`expenses` ötürülmədikdə `xerc` undefined qalır (geriyə uyğun, Dashboard çağırışı)", () => {
    const points = dailySeries([], 2);
    for (const p of points) {
      expect(p.xerc).toBeUndefined();
    }
  });

  it("`expenses` ötürüldükdə həmin günün xərc cəmini qaytarır — satış/qazanc EYNİ qalır", () => {
    const today = new Date().toISOString().slice(0, 10);
    const sales = [sale({ createdAt: `${today}T10:00:00.000Z`, totalAmount: 100, profit: 20 })];
    const expenses = [
      expense({ date: today, amount: 15 }),
      expense({ date: today, amount: 5 }),
    ];
    const points = dailySeries(sales, 1, expenses);
    expect(points).toHaveLength(1);
    expect(points[0].satis).toBe(100);
    expect(points[0].qazanc).toBe(20);
    expect(points[0].xerc).toBe(20);
  });

  it("başqa günün xərci həmin günün cəminə qarışmır", () => {
    const today = new Date().toISOString().slice(0, 10);
    const expenses = [expense({ date: "2000-01-01", amount: 999 })];
    const points = dailySeries([], 1, expenses);
    expect(points[0].fullDateIso).toBe(today);
    expect(points[0].xerc).toBe(0);
  });
});

describe("nonZeroCount / MIN_CHART_POINTS — FE#78 bənd #11 (seyrək data həddi)", () => {
  it("yalnız sıfırdan fərqli nöqtələri sayır", () => {
    const data = [{ v: 0 }, { v: 5 }, { v: 0 }, { v: 3 }];
    expect(nonZeroCount(data, (d) => d.v)).toBe(2);
  });

  it("hədd 2-dir — 0 və 1 nöqtə 'seyrək' hesab olunur", () => {
    expect(MIN_CHART_POINTS).toBe(2);
  });
});

describe("REPORT_COLORS — FE#78 bənd #13 (semantik ardıcıl rəng xəritəsi)", () => {
  it("hər sahə üçün bir rəng təyin edir və kart/nisyə fərqli rənglərdədir", () => {
    expect(REPORT_COLORS.sales).toBeTruthy();
    expect(REPORT_COLORS.profit).toBeTruthy();
    expect(REPORT_COLORS.expense).toBeTruthy();
    expect(REPORT_COLORS.credit).toBeTruthy();
    expect(REPORT_COLORS.card).toBeTruthy();
    // Əvvəlki bug: kart və nisyə rəngləri tərs idi (indeks əsaslı). İndi
    // hər ikisi fərqli, sabit rənglərdədir.
    expect(REPORT_COLORS.card).not.toBe(REPORT_COLORS.credit);
    // Satış və qazanc da fərqli tonlarda olmalıdır (ayrı seriyalar).
    expect(REPORT_COLORS.sales).not.toBe(REPORT_COLORS.profit);
  });
});

describe("paymentBreakdown — TOXUNULMAZ hesablama (yalnız rəng təqdimatı dəyişdi)", () => {
  it("Nağd/Kart/Nisyə cəmi satışın yekunu ilə eynidir", () => {
    const sales = [
      sale({ paidVia: "Nağd", paidAmount: 60, paymentType: "Nağd", totalAmount: 60 }),
      sale({ paidVia: "Kart", paidAmount: 40, paymentType: "Kart", totalAmount: 40 }),
    ];
    const result = paymentBreakdown(sales);
    const total = result.reduce((s, x) => s + x.value, 0);
    expect(total).toBe(100);
    expect(result.map((r) => r.name)).toEqual(["Nağd", "Kart", "Nisyə"]);
  });
});
