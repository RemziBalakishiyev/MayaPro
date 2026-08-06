import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmployeesTable } from "./EmployeesTable";

/**
 * FE#127 (TC-32.3) — işçi sorğusu şəbəkə xətası ilə uğursuz olduqda
 * "İşçi tapılmadı" boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən
 * cəhd et" düyməsi göstərilməlidir; `onRetry` `useEmployees().refetch`-ə
 * bağlanmalıdır.
 */
describe("EmployeesTable — şəbəkə xətası (FE#127)", () => {
  it("isError=true olduqda InlineError göstərir, 'İşçi tapılmadı' YOX", () => {
    render(<EmployeesTable employees={[]} isError onRetry={vi.fn()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("İşçilər yüklənmədi")).toBeInTheDocument();
    expect(screen.queryByText("İşçi tapılmadı")).not.toBeInTheDocument();
  });

  it("'Yenidən cəhd et' düyməsinə klik onRetry-ni çağırır", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<EmployeesTable employees={[]} isError onRetry={onRetry} />);

    await user.click(
      screen.getByRole("button", { name: /yenidən cəhd et/i }),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("isError=false və employees=[] olduqda normal EmptyState göstərir (regressiya)", () => {
    render(<EmployeesTable employees={[]} />);

    expect(screen.getByText("İşçi tapılmadı")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("isLoading=true olduqda spinner göstərir, InlineError və EmptyState YOX", () => {
    render(<EmployeesTable employees={[]} isLoading />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("İşçi tapılmadı")).not.toBeInTheDocument();
  });

  /**
   * FE#134 — işçi siyahısı artıq uğurla yüklənib (employees mövcuddur),
   * sonra arxa-fon (background) refetch-i uğursuz olur (`isError=true`,
   * amma köhnə/keçərli `employees` massivi ötürülür). Mövcud cədvəl
   * İTMƏMƏLİDİR və tam InlineError ekranı ilə ƏVƏZ OLUNMAMALIDIR.
   */
  it("uğurla yüklənmiş data varkən arxa-fon refetch xətası → cədvəl itmir, tam InlineError göstərilmir (FE#134)", () => {
    render(
      <EmployeesTable
        employees={[
          { id: "1", name: "Aysel", role: "Satıcı", phone: "0501234567", status: "Aktiv" } as never,
        ]}
        isError
        onRetry={vi.fn()}
      />,
    );

    expect(screen.queryByText("İşçilər yüklənmədi")).not.toBeInTheDocument();
    expect(screen.getByText("Aysel")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmə uğursuz oldu/i,
    );
  });
});
