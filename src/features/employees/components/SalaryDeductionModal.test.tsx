import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SalaryDeductionModal } from "./SalaryDeductionModal";
import { useCreateSalaryEntry } from "../queries";
import type { EmployeeSalarySummary } from "@/types";

vi.mock("../queries", async () => {
  const actual = await vi.importActual<typeof import("../queries")>("../queries");
  return { ...actual, useCreateSalaryEntry: vi.fn() };
});

const mockUseCreateSalaryEntry = vi.mocked(useCreateSalaryEntry);

const employee: EmployeeSalarySummary = {
  userId: "u1",
  fullName: "Rəşad Əliyev",
  role: "kassir",
  monthlySalary: 1000,
  paidTotal: 400,
  deductionTotal: 0,
  remaining: 600,
};

/**
 * FE#79 (AC-9/AC-10) — "Tutulma əlavə et" də paylaşılan `ConfirmDialog`
 * ilə təsdiqlənir (ad-hoc submit yox), kassaya təsir etmədiyi üçün kassa
 * qeydi göstərilmir.
 */
describe("SalaryDeductionModal", () => {
  let mutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseCreateSalaryEntry.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);
  });

  it("AC-9 — 'Davam et' ConfirmDialog açır, submit hələ çağrılmayıb, kassa qeydi YOXDUR", async () => {
    const user = userEvent.setup();
    render(
      <SalaryDeductionModal open employee={employee} month="2026-08" onClose={vi.fn()} />,
    );

    await user.type(screen.getByRole("spinbutton"), "50");
    await user.click(screen.getByRole("button", { name: /davam et/i }));

    expect(
      screen.getByRole("heading", { name: "Tutulmanı təsdiqlə" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Rəşad Əliyev")).toBeInTheDocument();
    expect(screen.getByText("50.00 ₼")).toBeInTheDocument();
    expect(
      screen.queryByText(/kassadan çıxacaq/i),
    ).not.toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("Boş səbəb ('Digər') validasiyası — 'Davam et' konfirmi açmır", async () => {
    const user = userEvent.setup();
    render(
      <SalaryDeductionModal open employee={employee} month="2026-08" onClose={vi.fn()} />,
    );
    await user.type(screen.getByRole("spinbutton"), "50");
    const reasonTrigger = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("Yemək"));
    await user.click(reasonTrigger!);
    await user.click(screen.getByRole("option", { name: "Digər" }));
    await user.click(screen.getByRole("button", { name: /davam et/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Səbəbi yazın");
    expect(
      screen.queryByRole("heading", { name: "Tutulmanı təsdiqlə" }),
    ).not.toBeInTheDocument();
  });

  it("Təsdiqi klikləyəndə mutateAsync type=deduction ilə çağırılır", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <SalaryDeductionModal open employee={employee} month="2026-08" onClose={onClose} />,
    );
    await user.type(screen.getByRole("spinbutton"), "50");
    await user.click(screen.getByRole("button", { name: /davam et/i }));
    await user.click(screen.getByRole("button", { name: /tutulmanı təsdiqlə/i }));

    expect(mutateAsync).toHaveBeenCalledWith({
      employeeId: "u1",
      input: { type: "deduction", amount: 50, note: "Yemək", month: "2026-08" },
    });
  });
});
