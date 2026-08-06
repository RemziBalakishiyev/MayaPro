import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentType } from "react";

/**
 * FE#134 (bonus) — Xərclər səhifəsi kod nəzərdən keçirilərkən Dashboard/
 * Hesabatlar/DataTable ilə eyni sinifdən analoji bug aşkar edildi: `isError`
 * yoxlaması `expenses`-dən ASILI OLMAYARAQ edilirdi. Arxa-fon (background)
 * refetch-i uğursuz olduqda TanStack Query `data`-nı (bu halda `expenses`)
 * ƏVVƏLKİ uğurlu nəticə ilə saxlayır — bu halda mövcud siyahı tam xəta
 * bloku ilə əvəz OLUNMAMALIDIR, əvəzinə kiçik `StaleDataBanner` göstərilməlidir.
 * Tam xəta bloku YALNIZ göstəriləcək xərc heç olmadıqda görünməlidir.
 */
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<
    typeof import("@tanstack/react-router")
  >("@tanstack/react-router");
  return {
    ...actual,
    // Xərclər `Route.useSearch()` / `Route.useNavigate()` çağırır — real
    // router konteksti olmadan bunlar idarə oluna bilən stub-larla əvəzlənir.
    createFileRoute: () => (options: Record<string, unknown>) => ({
      options,
      useSearch: () => ({ source: "all" }),
      useNavigate: () => vi.fn(),
    }),
  };
});

vi.mock("@/features/expenses/queries", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/expenses/queries")
  >("@/features/expenses/queries");
  return {
    ...actual,
    useExpenses: vi.fn(),
    useDeleteExpense: vi.fn(() => ({ mutateAsync: vi.fn() })),
  };
});

vi.mock("@/features/products/queries", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/products/queries")
  >("@/features/products/queries");
  return { ...actual, useProducts: vi.fn(() => ({ data: [] })) };
});

// Bu testin diqqət mərkəzi yalnız `isError`/`expenses` şərtidir — aşağı
// səviyyəli feature komponentləri (öz query asılılıqları ilə: useExpenseTypes,
// useEmployees, useCreateExpense və s.) trivial stub-larla təcrid olunur.
vi.mock("@/features/expenses/components/ExpenseForm", () => ({
  ExpenseForm: () => null,
}));
vi.mock("@/features/expenses/components/ExpenseDetailDrawer", () => ({
  ExpenseDetailDrawer: () => null,
}));
vi.mock("@/components/ui/ConfirmModal", () => ({
  ConfirmModal: () => null,
}));
vi.mock("@/components/ui/PeriodFilter", () => ({
  PeriodFilter: () => null,
}));
vi.mock("@/features/expenses/components/ExpenseFilters", () => ({
  ExpenseFilters: () => null,
}));

import { Route } from "./_app.xercler";
import { useExpenses } from "@/features/expenses/queries";

const mockUseExpenses = vi.mocked(useExpenses);
const XerclerPage = Route.options.component as ComponentType;

describe("Xərclər — arxa-fon refetch xətası (FE#134 bonus)", () => {
  beforeEach(() => {
    mockUseExpenses.mockReset();
  });

  it("isError=true, expenses BOŞDUR (ilk yükləmə xətası) → tam InlineError göstərir", () => {
    mockUseExpenses.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error("Şəbəkə xətası"),
      refetch: vi.fn(),
    } as never);

    render(<XerclerPage />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Şəbəkə xətası")).toBeInTheDocument();
    // "Yenidən cəhd et" düyməsi mövcuddur (əvvəlki versiyada yox idi)
    expect(
      screen.getByRole("button", { name: /yenidən cəhd et/i }),
    ).toBeInTheDocument();
  });

  it("'Yenidən cəhd et' düyməsinə klik refetch-i çağırır", async () => {
    const refetch = vi.fn();
    mockUseExpenses.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error("Şəbəkə xətası"),
      refetch,
    } as never);
    const user = userEvent.setup();

    render(<XerclerPage />);
    await user.click(
      screen.getByRole("button", { name: /yenidən cəhd et/i }),
    );

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("isError=false, expenses=[] → normal boş-siyahı vəziyyəti, alert YOX (regressiya)", () => {
    mockUseExpenses.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    render(<XerclerPage />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  /**
   * FE#134 — kassir/menecer artıq xərc siyahısına baxıb (`expenses` uğurla
   * yüklənib), sonra arxa-fon refetch-i qısa şəbəkə fasiləsi ilə uğursuz
   * olur. Mövcud siyahı İTMƏMƏLİDİR və tam xəta bloku ilə ƏVƏZ OLUNMAMALIDIR.
   */
  it("uğurla yüklənmiş data varkən arxa-fon refetch xətası → köhnə siyahı itmir, tam xəta bloku göstərilmir (FE#134)", () => {
    mockUseExpenses.mockReturnValue({
      data: [
        {
          id: "e1",
          title: "Elektrik",
          category: "Kommunal",
          source: "general",
          amount: 120,
          date: "2026-08-05",
          productId: null,
          note: "",
        },
      ],
      isLoading: false,
      isError: true,
      error: new Error("Şəbəkə xətası"),
      refetch: vi.fn(),
    } as never);

    render(<XerclerPage />);

    // Tam xəta bloku (server mesajı) YOX — mövcud siyahı itməyib
    expect(screen.queryByText("Şəbəkə xətası")).not.toBeInTheDocument();
    // Mobil kart + desktop cədvəl paralel render olunduğu üçün (CSS ilə
    // gizlədilir, jsdom-da hər ikisi DOM-dadır) ən azı bir nüsxə kifayətdir.
    expect(screen.getAllByText("Elektrik").length).toBeGreaterThan(0);

    // Əvəzinə kiçik xəbərdarlıq zolağı görünür
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmədi|köhnəlmiş/i,
    );
  });

  /**
   * FE#138 — uğurla yüklənmiş (`dataUpdatedAt > 0`) legitim BOŞ xərc siyahısı
   * + sonrakı arxa-fon refetch xətası → tam xəta bloku (InlineError) YOX,
   * boş-siyahı vəziyyəti + kiçik xəbərdarlıq zolağı göstərilməlidir.
   */
  it("uğurla yüklənmiş BOŞ siyahı + arxa-fon refetch xətası → tam xəta bloku YOX, xəbərdarlıq zolağı görünür (FE#138)", () => {
    mockUseExpenses.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error("Şəbəkə xətası"),
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    } as never);

    render(<XerclerPage />);

    // Tam xəta bloku (server mesajı) YOX
    expect(screen.queryByText("Şəbəkə xətası")).not.toBeInTheDocument();

    // Əvəzinə kiçik xəbərdarlıq zolağı görünür
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmədi|köhnəlmiş/i,
    );
  });
});
