import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmployeesTable } from "./EmployeesTable";
import type { Employee } from "@/types";

const employee: Employee = {
  id: "1",
  name: "Aysel",
  role: "Satıcı",
  phone: "0501234567",
  status: "Aktiv",
};

/**
 * FE#142 — işçi sorğusu şəbəkə xətası ilə uğursuz olduqda "İşçi tapılmadı"
 * boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən" düyməsi göstərilməlidir;
 * `onRetry` `useEmployees().refetch`-ə bağlanmalıdır. Əvvəl uğurla yüklənmiş
 * data varkən arxa-fon refetch xətası isə mövcud cədvəli İTİRMƏMƏLİDİR.
 */
describe("EmployeesTable — şəbəkə xətası (FE#142)", () => {
  it("isError=true, heç vaxt yüklənməyib (hasLoadedOnce yox) → InlineError göstərir, 'İşçi tapılmadı' YOX", () => {
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

  it("isLoading=true olduqda skeleton göstərir, InlineError və EmptyState YOX", () => {
    render(<EmployeesTable employees={[]} isLoading />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("İşçi tapılmadı")).not.toBeInTheDocument();
  });

  it("uğurla yüklənmiş data varkən arxa-fon refetch xətası → cədvəl itmir, tam InlineError göstərilmir (FE#142)", () => {
    render(
      <EmployeesTable
        employees={[employee]}
        isError
        onRetry={vi.fn()}
        hasLoadedOnce
      />,
    );

    expect(screen.queryByText("İşçilər yüklənmədi")).not.toBeInTheDocument();
    expect(screen.getByText("Aysel")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmə uğursuz oldu/i,
    );
  });

  it("uğurla yüklənmiş BOŞ siyahı (hasLoadedOnce) + arxa-fon xətası → EmptyState + xəbərdarlıq zolağı, tam InlineError YOX (FE#142)", () => {
    render(
      <EmployeesTable employees={[]} isError onRetry={vi.fn()} hasLoadedOnce />,
    );

    expect(screen.queryByText("İşçilər yüklənmədi")).not.toBeInTheDocument();
    expect(screen.getByText("İşçi tapılmadı")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmə uğursuz oldu/i,
    );
  });
});
