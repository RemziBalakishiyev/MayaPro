import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProductsTable } from "./ProductsTable";

/**
 * FE#87 (TC-32.1/32.2) — mal sorğusu şəbəkə xətası ilə uğursuz olduqda
 * "Mal tapılmadı" boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən"
 * düyməsi göstərilməlidir; `onRetry` `useProducts().refetch`-ə bağlanmalıdır.
 */
describe("ProductsTable — şəbəkə xətası (FE#87)", () => {
  it("isError=true olduqda InlineError göstərir, 'Mal tapılmadı' YOX", () => {
    render(
      <ProductsTable
        products={[]}
        isError
        onRetry={vi.fn()}
        onEdit={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Mallar yüklənmədi")).toBeInTheDocument();
    expect(screen.queryByText("Mal tapılmadı")).not.toBeInTheDocument();
  });

  it("'Yenidən' düyməsinə klik onRetry-ni çağırır (TC-32.2)", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <ProductsTable
        products={[]}
        isError
        onRetry={onRetry}
        onEdit={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("isError=false və data=[] olduqda normal EmptyState göstərir (TC-32.13 regressiya)", () => {
    render(
      <ProductsTable products={[]} onEdit={vi.fn()} onAdjust={vi.fn()} />,
    );
    expect(screen.getByText("Mal tapılmadı")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
