import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AlertPill, KpiCard, StatCluster } from "./KpiCard";

describe("KpiCard", () => {
  it("label/dəyər/alt sətri göstərir", () => {
    render(<KpiCard label="Mal sayı" value={16} sub="qeyd" />);
    expect(screen.getByText("Mal sayı")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("qeyd")).toBeInTheDocument();
  });

  it("yüklənmə vəziyyətində dəyəri göstərmir (skeleton)", () => {
    render(<KpiCard label="Mal sayı" isLoading />);
    expect(screen.queryByText("16")).not.toBeInTheDocument();
  });

  it("xəta vəziyyətində 'Yüklənmədi' göstərir və Yenidən düyməsi onRetry çağırır", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<KpiCard label="Mal sayı" isError onRetry={onRetry} />);
    expect(screen.getByText("Yüklənmədi")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  // FE#78 — `green`/`red` tonları əlavə edildi (mövcud `default`/`amber`
  // DƏYİŞMƏYİB, geriyə uyğun genişləndirmə).
  it("tone='green' dəyəri emerald rəngdə göstərir", () => {
    render(<KpiCard label="Xalis qazanc" value="100.00 ₼" tone="green" />);
    expect(screen.getByText("100.00 ₼")).toHaveClass("text-emerald-700");
  });

  it("tone='red' dəyəri qırmızı rəngdə göstərir", () => {
    render(<KpiCard label="Xərc" value="50.00 ₼" tone="red" />);
    expect(screen.getByText("50.00 ₼")).toHaveClass("text-red-600");
  });
});

describe("StatCluster", () => {
  const items = [
    { key: "count", label: "Mal sayı", value: 16 },
    { key: "stock", label: "Anbardakı ədəd", value: "240 ədəd" },
    { key: "cost", label: "Maya dəyəri", value: "5,230.50 ₼" },
  ];

  it("bütün stat-ları tək panel daxilində, ayrıca kart karkası olmadan göstərir", () => {
    const { container } = render(<StatCluster items={items} />);
    for (const item of items) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
      expect(screen.getByText(String(item.value))).toBeInTheDocument();
    }
    // Panel özü tək kart karkasıdır (bir dəfə), hər stat üçün ayrıca deyil.
    expect(container.querySelectorAll(".shadow-card")).toHaveLength(1);
  });

  it("yüklənmə vəziyyətində dəyərləri göstərmir", () => {
    render(<StatCluster items={items} isLoading />);
    expect(screen.queryByText("16")).not.toBeInTheDocument();
    expect(screen.getByText("Mal sayı")).toBeInTheDocument();
  });

  it("xəta vəziyyətində 'Yüklənmədi' göstərir və onRetry çağırılır", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<StatCluster items={items} isError onRetry={onRetry} />);
    expect(screen.getByText("Yüklənmədi")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("AlertPill", () => {
  it("klik olunduqda onClick çağırır", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<AlertPill onClick={onClick}>4 mal azalır</AlertPill>);
    const pill = screen.getByRole("button", { name: /4 mal azalır/ });
    await user.click(pill);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
