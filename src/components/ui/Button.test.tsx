import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

/**
 * FE#84 (AC-8/TC-6) — design-system.md §1.6: heç bir interaktiv kontrol
 * 40px-dən kiçik olmamalıdır. "sm" ölçüsü ən kiçik Button variantı olduğu
 * üçün minimum hədd buradan qorunur.
 */
describe("Button", () => {
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
});
