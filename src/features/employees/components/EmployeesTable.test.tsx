import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmployeesTable } from "./EmployeesTable";

/**
 * FE#103 (TC-32.3) — işçi sorğusu şəbəkə xətası ilə uğursuz olduqda
 * "İşçi tapılmadı" boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən"
 * düyməsi göstərilməlidir; `onRetry` `useEmployees().refetch`-ə bağlanmalıdır.
 */
describe("EmployeesTable — şəbəkə xətası (FE#103)", () => {
  it("isError=true olduqda InlineError göstərir, 'İşçi tapılmadı' YOX", () => {
    render(<EmployeesTable employees={[]} isError onRetry={vi.fn()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("İşçilər yüklənmədi")).toBeInTheDocument();
    expect(screen.queryByText("İşçi tapılmadı")).not.toBeInTheDocument();
  });

  it("'Yenidən' düyməsinə klik onRetry-ni çağırır", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<EmployeesTable employees={[]} isError onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("isError=false və employees=[] olduqda normal EmptyState göstərir (regressiya)", () => {
    render(<EmployeesTable employees={[]} />);

    expect(screen.getByText("İşçi tapılmadı")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
