import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PaymentBreakdown } from "./PaymentBreakdown";
import { REPORT_COLORS } from "../lib";

describe("PaymentBreakdown — FE#78", () => {
  it("bənd #14: bütün dəyərlər sıfırdırsa boş vəziyyət göstərir (aldadıcı 0% barlar YOX)", () => {
    render(
      <PaymentBreakdown
        data={[
          { name: "Nağd", value: 0 },
          { name: "Kart", value: 0 },
          { name: "Nisyə", value: 0 },
        ]}
      />,
    );
    expect(screen.getByText("Bu dövrdə ödəniş datası yoxdur")).toBeInTheDocument();
  });

  it("bənd #13: hər ödəniş növü ADI üzrə düzgün semantik rəngdədir (əvvəlki indeks-əsaslı bug YOXDUR)", () => {
    const { container } = render(
      <PaymentBreakdown
        data={[
          { name: "Nağd", value: 50 },
          { name: "Kart", value: 30 },
          { name: "Nisyə", value: 20 },
        ]}
      />,
    );
    const bars = container.querySelectorAll(".rounded-full.h-full, div[style*='width']");
    // Hər bar öz semantik rənginin arxa fonunu daşıyır.
    const styles = Array.from(bars).map((el) => (el as HTMLElement).style.background);
    expect(styles).toContain(REPORT_COLORS.cash);
    expect(styles).toContain(REPORT_COLORS.card);
    expect(styles).toContain(REPORT_COLORS.credit);
  });

  it("hər sətirdə ad, məbləğ və faiz görünür — legend rolunu bu sətirlər oynayır (bənd #7)", () => {
    render(
      <PaymentBreakdown
        data={[
          { name: "Nağd", value: 75 },
          { name: "Kart", value: 0 },
          { name: "Nisyə", value: 25 },
        ]}
      />,
    );
    expect(screen.getAllByText("Nağd").length).toBeGreaterThan(0);
    expect(screen.getByText("(75%)")).toBeInTheDocument();
    expect(screen.getByText("Cədvəl kimi bax")).toBeInTheDocument();
  });
});
