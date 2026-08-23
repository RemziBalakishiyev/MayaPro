import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { RouteErrorCard } from "./RouteErrorCard";

/**
 * FE#189 (bənd 3/5) — route-level error boundary: "Nəsə səhv getdi" kartı,
 * xəta tam stack ilə `console.error`-a yazılır (udulmur), [Yenidən yüklə]
 * `reset()` + `router.invalidate()` çağırır, invalidate rədd olunsa
 * `window.location.reload()`-a keçir.
 */
const mockInvalidate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>(
      "@tanstack/react-router",
    );
  return {
    ...actual,
    useRouter: () => ({ invalidate: mockInvalidate }),
  };
});

describe("RouteErrorCard", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockInvalidate.mockReset();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("'Nəsə səhv getdi' kartını göstərir və xətanı console.error-a tam stack ilə yazır", () => {
    const error = new Error("render partladı");
    render(<RouteErrorCard error={error} reset={vi.fn()} />);

    expect(screen.getByText("Nəsə səhv getdi")).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();
    const call = consoleErrorSpy.mock.calls.find((c: unknown[]) =>
      c.includes(error),
    );
    expect(call).toBeTruthy();
    expect(call).toContain(error.stack);
  });

  it("[Yenidən yüklə] → reset() və router.invalidate() çağırır", async () => {
    mockInvalidate.mockResolvedValue(undefined);
    const reset = vi.fn();
    render(<RouteErrorCard error={new Error("x")} reset={reset} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Yenidən yüklə" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });

  it("router.invalidate() rədd olunsa → window.location.reload() fallback işə düşür", async () => {
    mockInvalidate.mockRejectedValue(new Error("invalidate uğursuz"));
    const reloadSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, reload: reloadSpy },
    });

    render(<RouteErrorCard error={new Error("x")} reset={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Yenidən yüklə" }));

    // invalidate-in reject olunmuş promise-i mikrotask növbəsində həll olunur.
    await waitFor(() => expect(reloadSpy).toHaveBeenCalledTimes(1));

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });
});
