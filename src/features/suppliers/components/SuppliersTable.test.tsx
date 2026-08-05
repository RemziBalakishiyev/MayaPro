import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SuppliersTable } from "./SuppliersTable";

/**
 * FE#87 (TC-32.5/32.6) — təchizatçı sorğusu şəbəkə xətası ilə uğursuz
 * olduqda "Hələ təchizatçı yoxdur" boş-siyahı mesajı ƏVƏZİNƏ `InlineError`
 * + "Yenidən" düyməsi göstərilməlidir.
 */
describe("SuppliersTable — şəbəkə xətası (FE#87)", () => {
  it("isError=true olduqda InlineError göstərir, 'Hələ təchizatçı yoxdur' YOX", () => {
    render(
      <SuppliersTable
        suppliers={[]}
        isError
        onRetry={vi.fn()}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Təchizatçılar yüklənmədi")).toBeInTheDocument();
    expect(
      screen.queryByText("Hələ təchizatçı yoxdur"),
    ).not.toBeInTheDocument();
  });

  it("'Yenidən' düyməsinə klik onRetry-ni çağırır", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <SuppliersTable
        suppliers={[]}
        isError
        onRetry={onRetry}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("isError=false və data=[] olduqda normal EmptyState göstərir (regressiya)", () => {
    render(
      <SuppliersTable
        suppliers={[]}
        onView={vi.fn()}
        onAddDebt={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(screen.getByText("Hələ təchizatçı yoxdur")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
