import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewCustomerModal } from "./NewCustomerModal";
import { useCreateCustomer } from "../queries";

vi.mock("../queries", async () => {
  const actual =
    await vi.importActual<typeof import("../queries")>("../queries");
  return { ...actual, useCreateCustomer: vi.fn() };
});

const mockUseCreateCustomer = vi.mocked(useCreateCustomer);

/**
 * FE#188 — vahid telefon maskası: PhoneInput sahəyə tətbiq olunub, telefon
 * ixtiyaridir (əlavə tələb yaratmır), lakin doldurulubsa 9 yerli rəqəm tam
 * yazılmalıdır.
 */
describe("NewCustomerModal — PhoneInput (FE#188)", () => {
  let mutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mutateAsync = vi.fn().mockResolvedValue({ id: "c1", name: "Test" });
    mockUseCreateCustomer.mockReset();
    mockUseCreateCustomer.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);
  });

  it("telefon boş qalsa əlavə etməyə mane olmur (ixtiyari sahə)", async () => {
    const user = userEvent.setup();
    render(<NewCustomerModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/Müştəri adı/), "Yeni Müştəri");
    await user.click(screen.getByRole("button", { name: /əlavə et/i }));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ phone: "" }),
    );
  });

  it("natamam telefon nömrəsi (9 yerli rəqəmdən az) yazılanda 'Nömrəni tam yazın' xətası göstərilir, əlavə et düyməsi bloklanır", async () => {
    const user = userEvent.setup();
    render(<NewCustomerModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/Müştəri adı/), "Yeni Müştəri");
    await user.type(screen.getByPlaceholderText("50 123 45 67"), "501");

    expect(await screen.findByText("Nömrəni tam yazın")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /əlavə et/i })).toBeDisabled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("tam telefon nömrəsi yazılanda kanonik '994XXXXXXXXX' formatında göndərilir", async () => {
    const user = userEvent.setup();
    render(<NewCustomerModal open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/Müştəri adı/), "Yeni Müştəri");
    await user.type(screen.getByPlaceholderText("50 123 45 67"), "501234567");
    await user.click(screen.getByRole("button", { name: /əlavə et/i }));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ phone: "994501234567" }),
    );
  });
});
