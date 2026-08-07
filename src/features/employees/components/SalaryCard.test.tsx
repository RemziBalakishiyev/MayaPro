import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SalaryCard } from "./SalaryCard";
import { useSalaryEntries, useSetEmployeeSalary } from "../queries";
import type { EmployeeSalarySummary } from "@/types";

vi.mock("../queries", async () => {
  const actual = await vi.importActual<typeof import("../queries")>("../queries");
  return {
    ...actual,
    useSalaryEntries: vi.fn(),
    useSetEmployeeSalary: vi.fn(),
  };
});

const mockUseSalaryEntries = vi.mocked(useSalaryEntries);
const mockUseSetEmployeeSalary = vi.mocked(useSetEmployeeSalary);

const baseSummary: EmployeeSalarySummary = {
  userId: "u1",
  fullName: "Aysel Məmmədova",
  role: "sahib",
  monthlySalary: 1000,
  paidTotal: 400,
  deductionTotal: 0,
  remaining: 600,
};

const noop = () => {};

function setup(summary: EmployeeSalarySummary, canRecord = true, canSetSalary = true) {
  return render(
    <SalaryCard
      summary={summary}
      month="2026-08"
      canRecord={canRecord}
      canSetSalary={canSetSalary}
      onPay={noop}
      onDeduct={noop}
      onHistory={noop}
    />,
  );
}

describe("SalaryCard (FE#79)", () => {
  beforeEach(() => {
    mockUseSalaryEntries.mockReturnValue({ data: [] } as never);
    mockUseSetEmployeeSalary.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
  });

  it("AC-3 — üç standart göstərici eyni sətirdə, düzgün etiketlərlə", () => {
    setup(baseSummary);
    expect(screen.getByText("Aylıq maaş")).toBeInTheDocument();
    expect(screen.getByText("Bu ay ödənilib")).toBeInTheDocument();
    expect(screen.getByText("Qalıq məbləğ")).toBeInTheDocument();
    expect(screen.getByText("1,000.00 ₼")).toBeInTheDocument();
    expect(screen.getByText("400.00 ₼")).toBeInTheDocument();
    expect(screen.getByText("600.00 ₼")).toBeInTheDocument();
  });

  it("AC-4 — remaining < 0 olduqda 'Artıq ödəniş' narıncı göstərici görünür, 'Qalıq məbləğ' YOX", () => {
    setup({ ...baseSummary, paidTotal: 1100, remaining: -100 });
    expect(screen.getByText("Artıq ödəniş")).toBeInTheDocument();
    expect(screen.queryByText("Qalıq məbləğ")).not.toBeInTheDocument();
    expect(screen.getByText("100.00 ₼")).toBeInTheDocument();
  });

  it("AC-5 — maaş 0-dırsa proqres bar yoxdur, 'Maaş təyin olunmayıb' göstərilir, Sahibkar üçün keçid var", () => {
    const { container } = setup({ ...baseSummary, monthlySalary: 0, paidTotal: 0, remaining: 0 }, true, true);
    expect(screen.getByText("Maaş təyin olunmayıb")).toBeInTheDocument();
    expect(container.querySelector(".bg-emerald-600, .bg-orange-500")).toBeNull();
    expect(
      screen.getByRole("button", { name: /maaş təyin olunmayıb/i }),
    ).toBeInTheDocument();
  });

  it("AC-5 — canSetSalary=false olduqda 'Maaş təyin olunmayıb' üçün kliklənən keçid göstərilmir", () => {
    setup({ ...baseSummary, monthlySalary: 0, paidTotal: 0, remaining: 0 }, true, false);
    expect(screen.getByText("Maaş təyin olunmayıb")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /maaş təyin olunmayıb/i }),
    ).not.toBeInTheDocument();
  });

  it("AC-6 — rol Badge oxunaqlı Azərbaycanca etiketlə göstərilir (raw dəyər yox)", () => {
    setup({ ...baseSummary, role: "sahib" });
    expect(screen.getByText("Sahibkar")).toBeInTheDocument();
    expect(screen.queryByText("sahib")).not.toBeInTheDocument();
  });

  it("AC-7/AC-8 — 'Maaş ödə' əsas əməliyyat, 'Tutulma əlavə et'/'Tarixçəyə bax' tam mətnli", () => {
    setup(baseSummary);
    expect(screen.getByRole("button", { name: /^maaş ödə$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tutulma əlavə et/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tarixçəyə bax/i }),
    ).toBeInTheDocument();
    // Köhnə etiketlər artıq yoxdur.
    expect(screen.queryByText(/^pul ver$/i)).not.toBeInTheDocument();
  });
});
