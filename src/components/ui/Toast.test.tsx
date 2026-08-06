import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Toasts } from "./Toast";
import { useToastStore } from "./toast-store";

/**
 * FE#84 (AC-8/TC-6) — heç bir interaktiv kontrol 40px-dən kiçik olmamalıdır.
 * jsdom/happy-dom layout hesablamadığı üçün faktiki piksel ölçüsünü yox,
 * bunun əsasını təşkil edən min-toxunma-hədəfi class-larını yoxlayırıq.
 */
describe("Toasts", () => {
  it("bağlama düyməsi ən azı 40px (h-10 w-10) toxunma hədəfinə malikdir", () => {
    useToastStore.setState({
      toasts: [{ id: "t1", kind: "success", msg: "Uğurla saxlanıldı" }],
    });

    render(<Toasts />);

    const closeBtn = screen.getByRole("button", { name: "Bildirişi bağla" });
    expect(closeBtn).toHaveClass("h-10");
    expect(closeBtn).toHaveClass("w-10");
    // AC-15: yalnız-ikon düymə tooltip-siz qalmamalıdır (aria-label + title).
    expect(closeBtn).toHaveAttribute("title", "Bildirişi bağla");

    useToastStore.setState({ toasts: [] });
  });

  it("bağlama düyməsinə kliklədikdə toast siyahıdan silinir", async () => {
    const user = userEvent.setup();
    useToastStore.setState({
      toasts: [{ id: "t2", kind: "info", msg: "Məlumat mesajı" }],
    });

    render(<Toasts />);
    await user.click(screen.getByRole("button", { name: "Bildirişi bağla" }));

    expect(screen.queryByText("Məlumat mesajı")).not.toBeInTheDocument();

    useToastStore.setState({ toasts: [] });
  });
});
