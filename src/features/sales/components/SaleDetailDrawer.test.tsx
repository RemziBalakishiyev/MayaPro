import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { SaleDetailDrawer } from "./SaleDetailDrawer";
import { useSaleDetail } from "../queries";
import { useCustomers } from "@/features/customers/queries";
import { useEmployees } from "@/features/employees/queries";
import { useCan } from "@/features/auth/store";
import { useInvoiceDownload } from "../useInvoiceDownload";
import { useInvoiceWhatsApp } from "../useInvoiceWhatsApp";
import { ApiError } from "@/lib/api-client";

/**
 * FE#189 (bənd 2) — silinmiş satış linki: `useSaleDetail` 404 (`ApiError`)
 * qaytardıqda drawer içində çılpaq qırmızı mətn ƏVƏZİNƏ `EmptyState`
 * ("Bu qeyd tapılmadı" + geri qayıtma düyməsi) göstərilir. Digər (şəbəkə və s.)
 * xətalarda köhnə mətn davranışı qorunur.
 */
vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>(
      "@tanstack/react-router",
    );
  return {
    ...actual,
    Link: ({ children, ...rest }: { children?: ReactNode }) => (
      <a href="#" {...rest}>
        {children}
      </a>
    ),
  };
});

vi.mock("../queries", () => ({
  useSaleDetail: vi.fn(),
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

vi.mock("../useInvoiceDownload", () => ({
  useInvoiceDownload: vi.fn(),
}));

vi.mock("../useInvoiceWhatsApp", () => ({
  useInvoiceWhatsApp: vi.fn(),
}));

const mockUseSaleDetail = vi.mocked(useSaleDetail);
const mockUseCustomers = vi.mocked(useCustomers);
const mockUseEmployees = vi.mocked(useEmployees);
const mockUseCan = vi.mocked(useCan);
const mockUseInvoiceDownload = vi.mocked(useInvoiceDownload);
const mockUseInvoiceWhatsApp = vi.mocked(useInvoiceWhatsApp);

function setupCommonMocks() {
  mockUseCustomers.mockReturnValue({ data: [] } as unknown as ReturnType<
    typeof useCustomers
  >);
  mockUseEmployees.mockReturnValue({ data: [] } as unknown as ReturnType<
    typeof useEmployees
  >);
  mockUseCan.mockReturnValue(() => false);
  mockUseInvoiceDownload.mockReturnValue({
    download: vi.fn(),
    pendingId: null,
  });
  mockUseInvoiceWhatsApp.mockReturnValue({ send: vi.fn(), pendingId: null });
}

describe("SaleDetailDrawer — 404 / tapılmadı", () => {
  it("ApiError(404) → EmptyState 'Bu qeyd tapılmadı' + geri qayıtma düyməsi göstərir", async () => {
    setupCommonMocks();
    const notFoundError = new ApiError("Satış tapılmadı", "Sale.NotFound", 404);
    mockUseSaleDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: notFoundError,
    } as unknown as ReturnType<typeof useSaleDetail>);

    const onClose = vi.fn();
    render(
      <SaleDetailDrawer
        saleId="s-deleted"
        onClose={onClose}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Bu qeyd tapılmadı")).toBeInTheDocument();
    expect(
      screen.getByText("Bu satış silinmiş ola bilər."),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Siyahıya qayıt" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("digər xəta (şəbəkə/server) → köhnə qırmızı mətn davranışı qalır, EmptyState göstərilmir", () => {
    setupCommonMocks();
    mockUseSaleDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Şəbəkə xətası"),
    } as unknown as ReturnType<typeof useSaleDetail>);

    render(
      <SaleDetailDrawer
        saleId="s1"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Şəbəkə xətası")).toBeInTheDocument();
    expect(screen.queryByText("Bu qeyd tapılmadı")).not.toBeInTheDocument();
  });
});
