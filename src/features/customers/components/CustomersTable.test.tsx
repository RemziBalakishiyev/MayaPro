import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustomersTable } from "./CustomersTable";

/**
 * FE#87 (TC-32.3/32.4, TC-32.9/32.10) — müştəri sorğusu şəbəkə xətası ilə
 * uğursuz olduqda "Hələ müştəri yoxdur" boş-siyahı mesajı ƏVƏZİNƏ
 * `InlineError` + "Yenidən" düyməsi göstərilməlidir.
 */
describe("CustomersTable — şəbəkə xətası (FE#87)", () => {
  it("isError=true olduqda InlineError göstərir, 'Hələ müştəri yoxdur' YOX", () => {
    render(
      <CustomersTable
        customers={[]}
        isError
        onRetry={vi.fn()}
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Müştərilər yüklənmədi")).toBeInTheDocument();
    expect(screen.queryByText("Hələ müştəri yoxdur")).not.toBeInTheDocument();
  });

  it("'Yenidən' düyməsinə klik onRetry-ni çağırır", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <CustomersTable
        customers={[]}
        isError
        onRetry={onRetry}
        onView={vi.fn()}
        onPay={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("isError=false və data=[] olduqda normal EmptyState göstərir (regressiya)", () => {
    render(
      <CustomersTable customers={[]} onView={vi.fn()} onPay={vi.fn()} />,
    );
    expect(screen.getByText("Hələ müştəri yoxdur")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
