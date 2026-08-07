import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SalaryPayModal } from "./SalaryPayModal";
import { useCreateSalaryEntry } from "../queries";
import type { EmployeeSalarySummary } from "@/types";

vi.mock("../queries", async () => {
  const actual = await vi.importActual<typeof import("../queries")>("../queries");
  return { ...actual, useCreateSalaryEntry: vi.fn() };
});

const mockUseCreateSalaryEntry = vi.mocked(useCreateSalaryEntry);

const employee: EmployeeSalarySummary = {
  userId: "u1",
  fullName: "Aysel Məmmədova",
  role: "sahib",
  monthlySalary: 1000,
  paidTotal: 400,
  deductionTotal: 0,
  remaining: 600,
};

/**
 * FE#79 (AC-9/AC-10/AC-11) — "Maaş ödə" iki addımlı axını: forma → paylaşılan
 * `ConfirmDialog`. Həqiqi göndəriş YALNIZ təsdiq addımında baş verir.
 */
describe("SalaryPayModal", () => {
  let mutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseCreateSalaryEntry.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);
  });

  it("AC-11 — kassa təsiri qeydi forma addımında (təsdiqdən ƏVVƏL) görünür", () => {
    render(
      <SalaryPayModal open employee={employee} month="2026-08" onClose={vi.fn()} />,
    );
    expect(
      screen.getByText(/kassadan çıxacaq — gün sonunda nəzərə alınır/i),
    ).toBeInTheDocument();
  });

  it("AC-9/AC-10 — 'Davam et' ConfirmDialog açır, işçi/ay/məbləğ/qalıq (əvvəl→sonra) göstərilir, submit hələ çağrılmayıb", async () => {
    const user = userEvent.setup();
    render(
      <SalaryPayModal open employee={employee} month="2026-08" onClose={vi.fn()} />,
    );

    await user.type(screen.getByRole("spinbutton"), "100");
    await user.click(screen.getByRole("button", { name: /davam et/i }));

    expect(screen.getByText("Maaş ödənişini təsdiqlə")).toBeInTheDocument();
    expect(screen.getByText("Aysel Məmmədova")).toBeInTheDocument();
    expect(screen.getByText("Avqust 2026")).toBeInTheDocument();
    expect(screen.getByText("100.00 ₼")).toBeInTheDocument();
    // Eyni "Qalıq: əvvəl → sonra" mətni forma önizləməsində DƏ görünür —
    // ikisi də düzgün formatda olmalıdır.
    expect(screen.getAllByText("600.00 ₼ → 500.00 ₼").length).toBeGreaterThan(0);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("AC-10 — nəticədə qalıq mənfi olacaqsa narıncı xəbərdarlıq göstərilir", async () => {
    const user = userEvent.setup();
    render(
      <SalaryPayModal open employee={employee} month="2026-08" onClose={vi.fn()} />,
    );
    await user.type(screen.getByRole("spinbutton"), "700");
    await user.click(screen.getByRole("button", { name: /davam et/i }));
    expect(
      screen.getByText(/bu ödənişlə maaşdan artıq veriləcək/i),
    ).toBeInTheDocument();
  });

  it("Təsdiqi klikləyəndə createMut.mutateAsync çağırılır (type=payment)", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <SalaryPayModal open employee={employee} month="2026-08" onClose={onClose} />,
    );
    await user.type(screen.getByRole("spinbutton"), "100");
    await user.click(screen.getByRole("button", { name: /davam et/i }));
    await user.click(screen.getByRole("button", { name: /ödənişi təsdiqlə/i }));

    expect(mutateAsync).toHaveBeenCalledWith({
      employeeId: "u1",
      input: { type: "payment", amount: 100, note: undefined, month: "2026-08" },
    });
  });
});
