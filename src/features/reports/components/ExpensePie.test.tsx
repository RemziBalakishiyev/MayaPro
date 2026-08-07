import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpensePie } from "./ExpensePie";

describe("ExpensePie — FE#78", () => {
  it("data yoxdursa boş vəziyyət göstərir (kart daxilində, çərçivəsiz)", () => {
    render(<ExpensePie data={[]} />);
    expect(screen.getByText("Xərc datası yoxdur")).toBeInTheDocument();
  });

  it("bənd #7: legend və 'Cədvəl kimi bax' cədvəli göstərir", () => {
    render(
      <ExpensePie
        data={[
          { name: "Kirayə", value: 100 },
          { name: "İşıq", value: 50 },
        ]}
      />,
    );
    expect(screen.getByText("Cədvəl kimi bax")).toBeInTheDocument();
    // Legend + cədvəl hər ikisi kateqoriya adını göstərir.
    expect(screen.getAllByText("Kirayə").length).toBeGreaterThan(0);
    expect(screen.getByText("67%")).toBeInTheDocument();
  });
});
