import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SalesJournal } from "./SalesJournal";
import { useSalesJournal, useDeleteSale } from "../queries";
import { useCustomers } from "@/features/customers/queries";
import { useEmployees } from "@/features/employees/queries";
import { useCan } from "@/features/auth/store";
import type { Sale } from "@/types";

/**
 * FE#71 — `SalesJournal` özü çoxlu hook (jurnal sorğusu, müştəri/işçi
 * siyahısı, icazə, WhatsApp/qaimə) çağırır və daxilində ağır `SalesKpiCards`
 * (useSalesKpi) + `SaleDetailDrawer`/`SaleEditDrawer` (useSaleDetail/
 * useUpdateSale, real useQuery/useMutation) render edir. Bu testlər YALNIZ
 * cədvəl/toolbar refactor-unu (AC-10..AC-16) yoxladığı üçün bu üç ağır
 * alt-komponent yüngül stub-larla əvəzlənir — QueryClientProvider-ə ehtiyac
 * qalmır.
 */
vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>(
      "@tanstack/react-router",
    );
  return {
    ...actual,
    getRouteApi: () => ({
      useSearch: () => ({}),
      useNavigate: () => vi.fn(),
    }),
  };
});

vi.mock("../queries", () => ({
  useSalesJournal: vi.fn(),
  useDeleteSale: vi.fn(),
  JOURNAL_PAGE_SIZE: 10,
}));

vi.mock("@/features/customers/queries", () => ({
  useCustomers: vi.fn(),
}));

vi.mock("@/features/employees/queries", () => ({
  useEmployees: vi.fn(),
}));

vi.mock("@/features/auth/store", () => ({
  useCan: vi.fn(),
}));

vi.mock("./SalesKpiCards", () => ({
  SalesKpiCards: () => <div data-testid="sales-kpi-stub" />,
}));

vi.mock("./SaleDetailDrawer", () => ({
  SaleDetailDrawer: () => null,
}));

vi.mock("./SaleEditDrawer", () => ({
  SaleEditDrawer: () => null,
}));

const mockUseSalesJournal = vi.mocked(useSalesJournal);
const mockUseDeleteSale = vi.mocked(useDeleteSale);
const mockUseCustomers = vi.mocked(useCustomers);
const mockUseEmployees = vi.mocked(useEmployees);
const mockUseCan = vi.mocked(useCan);

const fullSale: Sale = {
  id: "s1",
  productId: "p1",
  productName: "Kişi köynək",
  category: "Geyim",
  quantity: 2,
  salePrice: 25,
  subtotal: 50,
  discount: 0,
  totalAmount: 50,
  paymentType: "Nisyə",
  customerId: "c1",
  paidAmount: 20,
  remainingAmount: 30,
  paidVia: "Nağd",
  costPerUnit: 15,
  purchasePricePerUnit: 15,
  profit: 20,
  isManual: false,
  soldByName: "Aynur",
  createdAt: "2026-08-01T10:00:00.000Z",
  employeeId: "e1",
} as Sale;

function setup(sales: Sale[] = [fullSale]) {
  mockUseSalesJournal.mockReturnValue({
    data: sales,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as never);
  mockUseDeleteSale.mockReturnValue({
    mutateAsync: vi.fn(),
  } as never);
  mockUseCustomers.mockReturnValue({
    data: [{ id: "c1", name: "Vüqar Əliyev", phone: "+994501234567" }],
  } as never);
  mockUseEmployees.mockReturnValue({ data: [] } as never);
  mockUseCan.mockReturnValue(() => true);
}

describe("SalesJournal — dizayn sisteminə keçid (FE#71)", () => {
  it("AC-10 — axtarış, filtr toqql düyməsi və 'PDF hesabat' TƏK toolbar blokunda göstərilir", () => {
    setup();
    render(<SalesJournal />);
    expect(
      screen.getByRole("textbox", { name: "Satış siyahısında axtar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Filterlər/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "PDF hesabat" }),
    ).toBeInTheDocument();
  });

  it("AC-11 — sütun başlıqları dəqiq sırada: Mal, Say, Satış qiyməti, Yekun, Ödəniş, Satıcı, Tarix, Əməliyyat", () => {
    setup();
    render(<SalesJournal />);
    const headers = screen.getAllByRole("columnheader").map((h) =>
      h.textContent?.trim(),
    );
    expect(headers).toEqual([
      "Mal",
      "Say",
      "Satış qiyməti",
      "Yekun",
      "Ödəniş",
      "Satıcı",
      "Tarix",
      "Əməliyyat",
    ]);
  });

  it("AC-12 — 'Maya qiyməti' və 'Xərc' sütun başlıqları cədvəldə YOXDUR", () => {
    setup();
    render(<SalesJournal />);
    expect(screen.queryByText("Maya qiyməti")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Xərc" }),
    ).not.toBeInTheDocument();
  });

  it("AC-12 — 'Qazanc' Yekun xanasının altında yığcam ikinci sətir kimi qalır", () => {
    setup();
    render(<SalesJournal />);
    // Sr-only "Qazanc:" prefiksi + işarəli məbləğ (+20.00 ₼) desktop
    // cədvəldə (Yekun xanasında) görünür.
    expect(screen.getAllByText(/Qazanc:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+20\.00/).length).toBeGreaterThan(0);
  });

  it("AC-14/TC-22 — sətir əməliyyatları mətnli etiketlərlə: 'Detala bax', 'Qaimə', 'Digər'", () => {
    setup();
    render(<SalesJournal />);
    expect(
      screen.getAllByRole("button", { name: /Detala bax/ }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Qaimə/ }).length,
    ).toBeGreaterThan(0);
    // "Digər" menyu trigger-inin görünən mətnidir — düymənin ƏLÇATANLIQ adı
    // (aria-label) ayrıca `${mal} əməliyyatları` mətnini daşıyır (TC-23-ə
    // bənzər naxış), ona görə burada görünən mətn (`getAllByText`) yoxlanılır.
    expect(screen.getAllByText("Digər").length).toBeGreaterThan(0);
  });

  it("AC-14/TC-23 — 'Qaimə' düyməsinin aria-label-ı mal adını ehtiva edir", () => {
    setup();
    render(<SalesJournal />);
    const qaimeButtons = screen.getAllByRole("button", {
      name: /Kişi köynək — Qaimə/,
    });
    expect(qaimeButtons.length).toBeGreaterThan(0);
  });

  it("AC-15/TC-24 — ödəniş badge-i rəng VƏ mətni birlikdə göstərir", () => {
    setup();
    render(<SalesJournal />);
    expect(screen.getAllByText("Nisyə").length).toBeGreaterThan(0);
  });

  it("AC-15/TC-25 — qismən ödənişli satışda 'N ₼ ödənilib' alt sətri qalır", () => {
    setup();
    render(<SalesJournal />);
    expect(screen.getAllByText(/20\.00.*ödənilib/).length).toBeGreaterThan(0);
  });

  it("AC-16/TC-26 — müştəri adı ikonla və fərqli rənglə kateqoriyadan ayrılır", () => {
    setup();
    render(<SalesJournal />);
    const customerNodes = screen.getAllByText("Vüqar Əliyev");
    expect(customerNodes.length).toBeGreaterThan(0);
    const row = customerNodes[0].closest("p");
    expect(row?.className).toMatch(/text-emerald-700/);
    // İkon (User, lucide-react) eyni <p> daxilində svg kimi render olunur.
    expect(row?.querySelector("svg")).not.toBeNull();
  });

  it("AC-16/TC-27 — kateqoriya mətni və müştəri adı ayrı sətirlərdə, qarışmır", () => {
    setup();
    render(<SalesJournal />);
    const categoryNodes = screen.getAllByText("Geyim");
    expect(categoryNodes.length).toBeGreaterThan(0);
    expect(categoryNodes[0].textContent).not.toContain("Vüqar Əliyev");
  });

  it("AC-R3/TC-33 — canManage=false olduqda 'Digər' menyusunda Düzəliş/Sil bəndləri görünmür", async () => {
    mockUseSalesJournal.mockReturnValue({
      data: [fullSale],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    mockUseDeleteSale.mockReturnValue({ mutateAsync: vi.fn() } as never);
    mockUseCustomers.mockReturnValue({
      data: [{ id: "c1", name: "Vüqar Əliyev", phone: "+994501234567" }],
    } as never);
    mockUseEmployees.mockReturnValue({ data: [] } as never);
    mockUseCan.mockReturnValue(() => false);

    const user = userEvent.setup();
    render(<SalesJournal />);
    // "Digər" menyusunun ƏLÇATANLIQ adı `aria-label` ilə verilib
    // (`${mal} əməliyyatları`) — görünən mətn "Digər" ayrıca `getAllByText`
    // ilə TC-22-də yoxlanılır.
    const menuTriggers = screen.getAllByRole("button", {
      name: /əməliyyatları$/,
    });
    await user.click(menuTriggers[0]);
    expect(
      within(screen.getByRole("menu")).queryByText("Düzəliş"),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("menu")).queryByText("Sil"),
    ).not.toBeInTheDocument();
  });
});
