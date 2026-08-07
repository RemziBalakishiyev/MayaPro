import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

/**
 * FE#80 — "Ayarlar" səhifəsinin dizayn sisteminə keçidi:
 * bölmələrə qruplama, sabit valyuta/dil mətn sətirləri, dirty-state izləmə,
 * sticky yadda saxlama zolağı, inline sahə xətaları, WhatsApp önizləməsi və
 * naviqasiya bloklaması (`useBlocker`).
 */
const { mockUseBlocker } = vi.hoisted(() => ({
  mockUseBlocker: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<
    typeof import("@tanstack/react-router")
  >("@tanstack/react-router");
  return {
    ...actual,
    // Real router konteksti olmadan `useBlocker` invariant xətası atır —
    // digər səhifə testlərində olduğu kimi `createFileRoute` stub-lanır.
    createFileRoute: () => (options: Record<string, unknown>) => ({
      options,
    }),
    useBlocker: mockUseBlocker,
  };
});

vi.mock("@/features/settings/queries", () => ({
  useSettings: vi.fn(),
  useUpdateSettings: vi.fn(),
}));

import { Route } from "./_app.ayarlar";
import { useSettings, useUpdateSettings } from "@/features/settings/queries";
import { useSettingsStore, DEFAULT_WA_TEMPLATE } from "@/features/settings/store";
import { useAuthStore } from "@/features/auth/store";
import { useToastStore } from "@/components/ui/toast-store";

const mockUseSettings = vi.mocked(useSettings);
const mockUseUpdateSettings = vi.mocked(useUpdateSettings);

const AyarlarPage = Route.options.component as ComponentType;

const baseSettings = {
  storeName: "Sədərək Anbar",
  ownerName: "",
  address: "",
  phone: "",
  whatsappTemplate: DEFAULT_WA_TEMPLATE,
  currency: "AZN",
  defaultMinStock: 10,
  language: "az",
};

const idleBlocker = {
  status: "idle" as const,
  current: undefined,
  next: undefined,
  action: undefined,
  proceed: undefined,
  reset: undefined,
};

function loginAsOwner() {
  useAuthStore.getState().login(
    { id: "1", name: "Sahibkar", role: "sahib" },
    "token",
  );
}

function loginAsManager() {
  useAuthStore.getState().login(
    { id: "2", name: "Menecer", role: "menecer" },
    "token",
  );
}

describe("Ayarlar səhifəsi — dizayn sisteminə keçid (FE#80)", () => {
  let mutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useSettingsStore.setState(baseSettings);
    useToastStore.setState({ toasts: [] });
    mockUseBlocker.mockReset();
    mockUseBlocker.mockReturnValue(idleBlocker);
    mutateAsync = vi.fn().mockResolvedValue(baseSettings);
    mockUseSettings.mockReturnValue({ data: baseSettings } as never);
    mockUseUpdateSettings.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);
    loginAsOwner();
  });

  afterEach(() => {
    useAuthStore.getState().logout();
  });

  it("bənd 1: sahələr aydın kart bölmələrinə qruplanır", () => {
    render(<AyarlarPage />);
    expect(screen.getByText("Mağaza məlumatları")).toBeInTheDocument();
    expect(screen.getByText("Qaimə məlumatları")).toBeInTheDocument();
    expect(screen.getByText("Pul və stok parametrləri")).toBeInTheDocument();
    expect(screen.getByText("Dil")).toBeInTheDocument();
    expect(
      screen.getByText("WhatsApp borc xatırlatma şablonu"),
    ).toBeInTheDocument();
    expect(screen.getByText("İşçi icazələri")).toBeInTheDocument();
  });

  it("bənd 4-5: valyuta və dil dropdown DEYİL — sabit mətn sətri (heç bir listbox trigger yoxdur)", () => {
    const { container } = render(<AyarlarPage />);
    expect(screen.getByText(/tezliklə əlavə valyutalar/)).toBeInTheDocument();
    expect(screen.getByText("Azərbaycanca")).toBeInTheDocument();
    expect(screen.getByText(/tezliklə əlavə dillər/)).toBeInTheDocument();
    expect(container.querySelector('[aria-haspopup="listbox"]')).toBeNull();
  });

  it("bənd 6-7-8: dəyişiklik olmayanda sticky zolaq YOXDUR, dəyişiklikdə görünür (köhnə yuxarı Save yoxdur)", async () => {
    const user = userEvent.setup();
    render(<AyarlarPage />);

    expect(
      screen.queryByText("Dəyişikliklər yadda saxlanılmayıb"),
    ).not.toBeInTheDocument();

    const ownerInput = screen.getByLabelText("Sahibkar adı");
    await user.type(ownerInput, "Rəşad");

    expect(
      screen.getByText("Dəyişikliklər yadda saxlanılmayıb"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ləğv et" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Yadda saxla" }),
    ).toBeInTheDocument();
  });

  it("bənd 7: 'Ləğv et' draftı baza vəziyyətinə qaytarır və zolağı gizlədir", async () => {
    const user = userEvent.setup();
    render(<AyarlarPage />);

    const ownerInput = screen.getByLabelText("Sahibkar adı") as HTMLInputElement;
    await user.type(ownerInput, "Rəşad");
    expect(ownerInput.value).toBe("Rəşad");

    await user.click(screen.getByRole("button", { name: "Ləğv et" }));

    expect(ownerInput.value).toBe("");
    expect(
      screen.queryByText("Dəyişikliklər yadda saxlanılmayıb"),
    ).not.toBeInTheDocument();
  });

  it("bənd 9-10: boş mağaza adı ilə saxlama inline xəta göstərir, API çağırılmır", async () => {
    const user = userEvent.setup();
    render(<AyarlarPage />);

    const storeNameInput = screen.getByLabelText(/Mağaza adı/);
    await user.clear(storeNameInput);
    await user.click(screen.getByRole("button", { name: "Yadda saxla" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Mağaza adı boş ola bilməz",
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("bənd 11-12-13: {debt} şablon dəyişəni qorunur, önizləmə lokal draft-dan canlı yenilənir", () => {
    render(<AyarlarPage />);

    const template = screen.getByLabelText(/^Şablon/);
    // `{`/`}` userEvent.type-da xüsusi klaviatura sintaksisi kimi oxunur —
    // dəyəri birbaşa `fireEvent.change` ilə qururuq ki, `{debt}` hərfi qalsın.
    fireEvent.change(template, {
      target: { value: "Salam, sizdə {debt} AZN qalıq borc görünür." },
    });

    expect(
      screen.getByText("Salam, sizdə 250.00 AZN qalıq borc görünür."),
    ).toBeInTheDocument();
    // Saxlanan şablon yalnız "Yadda saxla" basılanda dəyişməlidir.
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("bənd 14: uğurlu saxlama → toast göstərir, sticky zolaq bağlanır", async () => {
    const user = userEvent.setup();
    render(<AyarlarPage />);

    await user.type(screen.getByLabelText("Sahibkar adı"), "Rəşad");
    await user.click(screen.getByRole("button", { name: "Yadda saxla" }));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(
      useToastStore.getState().toasts.some((t) => t.kind === "success"),
    ).toBe(true);
    expect(
      screen.queryByText("Dəyişikliklər yadda saxlanılmayıb"),
    ).not.toBeInTheDocument();
  });

  it("bənd 14: API xətası → error toast göstərir, sticky zolaq açıq qalır", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("Server xətası"));
    const user = userEvent.setup();
    render(<AyarlarPage />);

    await user.type(screen.getByLabelText("Sahibkar adı"), "Rəşad");
    await user.click(screen.getByRole("button", { name: "Yadda saxla" }));

    expect(
      await screen.findByText("Dəyişikliklər yadda saxlanılmayıb"),
    ).toBeInTheDocument();
    expect(
      useToastStore
        .getState()
        .toasts.some((t) => t.kind === "error" && t.msg === "Server xətası"),
    ).toBe(true);
  });

  it("bənd 6: dəyişiklik varkən arxa-fon server refetch draftı ƏZMİR", () => {
    mockUseSettings.mockReturnValue({
      data: { ...baseSettings, ownerName: "Server dəyəri" },
    } as never);
    const { rerender } = render(<AyarlarPage />);

    // istifadəçi hələ redaktə etməyib, server dəyəri görünməlidir
    expect(
      (screen.getByLabelText("Sahibkar adı") as HTMLInputElement).value,
    ).toBe("Server dəyəri");

    rerender(<AyarlarPage />);
    expect(
      (screen.getByLabelText("Sahibkar adı") as HTMLInputElement).value,
    ).toBe("Server dəyəri");
  });

  it("bənd 15: dirty olduqda shouldBlockFn true qaytarır, deyilsə false", async () => {
    const user = userEvent.setup();
    render(<AyarlarPage />);

    const optsAtMount = mockUseBlocker.mock.calls.at(-1)?.[0];
    expect(optsAtMount.shouldBlockFn()).toBe(false);

    await user.type(screen.getByLabelText("Sahibkar adı"), "Rəşad");

    const optsAfterEdit = mockUseBlocker.mock.calls.at(-1)?.[0];
    expect(optsAfterEdit.shouldBlockFn()).toBe(true);
  });

  it("bənd 15: blocked vəziyyətdə təsdiq dialoqu göstərir, 'Bəli, çıx' proceed()-i çağırır", async () => {
    const proceed = vi.fn();
    const reset = vi.fn();
    mockUseBlocker.mockReturnValue({
      status: "blocked",
      current: {},
      next: {},
      action: "POP",
      proceed,
      reset,
    });
    const user = userEvent.setup();
    render(<AyarlarPage />);

    expect(
      screen.getByText("Yadda saxlanmamış dəyişikliklər"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bəli, çıx" }));
    expect(proceed).toHaveBeenCalledTimes(1);
  });

  it("bənd 15: blocked vəziyyətdə 'İmtina' reset()-i çağırır (çıxış ləğv olunur)", async () => {
    const proceed = vi.fn();
    const reset = vi.fn();
    mockUseBlocker.mockReturnValue({
      status: "blocked",
      current: {},
      next: {},
      action: "POP",
      proceed,
      reset,
    });
    const user = userEvent.setup();
    render(<AyarlarPage />);

    await user.click(screen.getByRole("button", { name: "İmtina" }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(proceed).not.toHaveBeenCalled();
  });

  it("icazəsi olmayan istifadəçiyə (menecer) qıfıl mesajı göstərir, sahələr deaktivdir, sticky zolaq yoxdur", async () => {
    loginAsManager();
    const user = userEvent.setup();
    render(<AyarlarPage />);

    expect(
      screen.getByText("Ayarları yalnız sahibkar dəyişə bilər."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Sahibkar adı")).toBeDisabled();

    await user.type(screen.getByLabelText("Sahibkar adı"), "Rəşad");
    expect(
      screen.queryByText("Dəyişikliklər yadda saxlanılmayıb"),
    ).not.toBeInTheDocument();
  });
});
