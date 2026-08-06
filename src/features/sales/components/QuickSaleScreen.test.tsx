import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuickSaleScreen } from "./QuickSaleScreen";
import { useProducts } from "@/features/products/queries";
import { useCustomers } from "@/features/customers/queries";
import { useCreateSale } from "../queries";
import { useInvoiceDownload } from "../useInvoiceDownload";
import { useInvoiceWhatsApp } from "../useInvoiceWhatsApp";

// FE#71 — `QuickSaleScreen`, boş axtarışda `SalesJournal`-ı (ağır hook
// zənciri: useSalesJournal/useCustomers/useEmployees/useSalesKpi/...)
// render edir. Bu fayldakı testlər YALNIZ mal seçim ekranını (AC-1..AC-5)
// yoxlayır, ona görə `SalesJournal` yüngül stub-la əvəzlənir.
vi.mock("./SalesJournal", () => ({
  SalesJournal: () => <div data-testid="sales-journal-stub" />,
}));

// `NewCustomerModal` real `useCreateCustomer` (useMutation) mutasiyasını
// çağırır — QueryClientProvider-siz mühitdə xəta atır. Bu ekranda həmişə
// (bağlı vəziyyətdə) mount olunur, ona görə stub-lanır.
vi.mock("@/features/customers/components/NewCustomerModal", () => ({
  NewCustomerModal: () => null,
}));

vi.mock("@/features/products/queries", () => ({
  useProducts: vi.fn(),
}));
vi.mock("@/features/customers/queries", () => ({
  useCustomers: vi.fn(),
}));
vi.mock("../queries", () => ({
  useCreateSale: vi.fn(),
}));
vi.mock("../useInvoiceDownload", () => ({
  useInvoiceDownload: vi.fn(),
}));
vi.mock("../useInvoiceWhatsApp", () => ({
  useInvoiceWhatsApp: vi.fn(),
}));

const mockUseProducts = vi.mocked(useProducts);
const mockUseCustomers = vi.mocked(useCustomers);
const mockUseCreateSale = vi.mocked(useCreateSale);
const mockUseInvoiceDownload = vi.mocked(useInvoiceDownload);
const mockUseInvoiceWhatsApp = vi.mocked(useInvoiceWhatsApp);

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe("QuickSaleScreen — mal seçim ekranı (FE#71)", () => {
  beforeEach(() => {
    setViewportWidth(1280);
    mockUseProducts.mockReturnValue({ data: [] } as never);
    mockUseCustomers.mockReturnValue({ data: [] } as never);
    mockUseCreateSale.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never);
    mockUseInvoiceDownload.mockReturnValue({
      download: vi.fn(),
      pendingId: null,
    } as never);
    mockUseInvoiceWhatsApp.mockReturnValue({
      send: vi.fn(),
      pendingId: null,
    } as never);
  });

  afterEach(() => {
    setViewportWidth(1280);
  });

  it("AC-5 — axtarış inputunun placeholder-i hərfi olaraq 'Mal adı və ya barkod — satış üçün'-dür", () => {
    render(<QuickSaleScreen />);
    expect(
      screen.getByPlaceholderText("Mal adı və ya barkod — satış üçün"),
    ).toBeInTheDocument();
  });

  it("AC-1 — axtarış inputu böyük/dominant tipoqrafiya sinifləri ilə render olunur", () => {
    render(<QuickSaleScreen />);
    const input = screen.getByPlaceholderText(
      "Mal adı və ya barkod — satış üçün",
    );
    expect(input.className).toMatch(/h-16/);
    expect(input.className).toMatch(/text-lg/);
  });

  it("AC-4 — 'Sərbəst satış' düyməsi kiçik/ikinci dərəcəli (dolu emerald fon YOX) görünüşdədir", () => {
    render(<QuickSaleScreen />);
    const button = screen.getByRole("button", { name: /Sərbəst satış/ });
    expect(button.className).toMatch(/h-10/);
    expect(button.className).not.toMatch(/bg-emerald-700/);
  });

  it("AC-2 — masaüstündə, heç bir modal açıq olmadan səhifə açılanda axtarış avtomatik fokuslanır", () => {
    render(<QuickSaleScreen />);
    const input = screen.getByPlaceholderText(
      "Mal adı və ya barkod — satış üçün",
    );
    expect(input).toHaveFocus();
  });

  it("AC-2/TC-03 — mobil (375px) ekranda avtofokus TƏTBİQ OLUNMUR", () => {
    setViewportWidth(375);
    render(<QuickSaleScreen />);
    const input = screen.getByPlaceholderText(
      "Mal adı və ya barkod — satış üçün",
    );
    expect(input).not.toHaveFocus();
  });

  it("AC-3 — axtarış inputuna yazılan mətn (barkod skaner simulyasiyası) `search` state-ini dolduraraq nəticə grid-ini göstərir, form submit olunmur", async () => {
    mockUseProducts.mockReturnValue({
      data: [
        {
          id: "p1",
          name: "Su 0.5L",
          barcode: "SDK1001",
          category: "İçki",
          attributes: [],
          salePrice: 1.5,
          quantity: 10,
          minStock: 2,
          realCostPerUnit: 1,
        },
      ],
    } as never);
    const user = userEvent.setup();
    render(<QuickSaleScreen />);
    const input = screen.getByPlaceholderText(
      "Mal adı və ya barkod — satış üçün",
    );
    await user.type(input, "SDK1001{Enter}");
    expect(input).toHaveValue("SDK1001");
    // Barkoda uyğun mal kart grid-ində görünür — heç bir xəta/naviqasiya yoxdur.
    expect(screen.getByText("Su 0.5L")).toBeInTheDocument();
  });

  it("boş axtarışda satış jurnalı (stub) göstərilir", () => {
    render(<QuickSaleScreen />);
    expect(screen.getByTestId("sales-journal-stub")).toBeInTheDocument();
  });
});
