import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpenseAmount, ExpenseOutflowTag } from "./amount-presentation";

/**
 * FE#76 (AC-5..AC-8) — xərc məbləğinin vahid, neytral, işarəsiz təqdimatı.
 * Bu unit testlər cədvəl/mobil kart/drawer/xülasə arasında formatın
 * SÜRÜŞMƏDİYİNİ tək mənbədən (bu modul) təsdiqləyir.
 */
describe("ExpenseAmount", () => {
  it("rəqəmi İŞARƏSİZ göstərir (mənfi/minus prefiksi YOX)", () => {
    render(<ExpenseAmount amount={123} />);
    expect(screen.getByText("123.00 ₼")).toBeInTheDocument();
    expect(screen.queryByText(/−123|-123/)).not.toBeInTheDocument();
  });

  it("mənfi ötürülsə belə (nəzəri) heç bir əlavə işarə əlavə etmir — fmtMoney xam dəyəri göstərir", () => {
    // Qeyd: Expense.amount biznes qaydasına görə həmişə müsbətdir; bu test
    // yalnız komponentin ƏLAVƏ işarə MƏNTİQİ olmadığını təsdiqləyir.
    render(<ExpenseAmount amount={0} />);
    expect(screen.getByText("0.00 ₼")).toBeInTheDocument();
  });

  it("heç bir elementdə text-red-* sinfi yoxdur (rəng qaydası: xərc = normal əməliyyat)", () => {
    const { container } = render(<ExpenseAmount amount={500} />);
    expect(container.querySelectorAll('[class*="text-red-"]').length).toBe(0);
  });

  it("kiçik boz 'çıxış' konteksti göstərir (rəng deyil, ikon+mətn)", () => {
    render(<ExpenseAmount amount={10} />);
    expect(screen.getByText("çıxış")).toBeInTheDocument();
  });

  it("ölçü (size) prop tipoqrafiya sinfini dəyişir, formatı DƏYİŞMİR", () => {
    const { container: sm } = render(<ExpenseAmount amount={10} size="sm" />);
    const { container: lg } = render(<ExpenseAmount amount={10} size="lg" />);
    expect(sm.querySelector(".text-sm")).toBeTruthy();
    expect(lg.querySelector(".text-2xl")).toBeTruthy();
  });
});

describe("ExpenseOutflowTag", () => {
  it("'çıxış' mətnini göstərir, ikon aria-hidden-dir (əlavə status siqnalı rəng deyil)", () => {
    const { container } = render(<ExpenseOutflowTag />);
    expect(screen.getByText("çıxış")).toBeInTheDocument();
    const icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
