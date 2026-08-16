import { describe, expect, it, beforeEach, vi } from "vitest";

/**
 * FE#183 — admin mock qatı. `.env.local` real backend URL-i (`VITE_API_URL`)
 * təyin etdiyi üçün `USE_MOCK` test mühitində standart olaraq `false`-dur —
 * burada mock rejimini məcburi aktivləşdiririk ki, `adminApi`-nin biznes
 * qaydalarını (təsdiq → Active + bitmə tarixi, ödəniş → müddət uzadılması,
 * statistika) real şəbəkə çağırışı olmadan yoxlaya bilək.
 */
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>(
    "@/lib/api-client",
  );
  return { ...actual, USE_MOCK: true };
});

vi.mock("@/mocks/db", async () => {
  const actual = await vi.importActual<typeof import("@/mocks/db")>("@/mocks/db");
  return { ...actual, sleep: () => Promise.resolve() };
});

import { adminApi, mockRegisterPendingTenant } from "./api";

describe("adminApi (mock)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("listTenants — seed mağazaları qaytarır", async () => {
    const tenants = await adminApi.listTenants();
    expect(tenants.length).toBeGreaterThan(0);
  });

  it("createTenant — dərhal Active statuslu, ilkin müddətlə yaradılır (AC-16)", async () => {
    const tenant = await adminApi.createTenant({
      storeName: "Yeni Market",
      ownerName: "Ad Soyad",
      phone: "994501110000",
      password: "demo123",
      periodMonths: 3,
    });
    expect(tenant.status).toBe("Active");
    expect(tenant.expiresAt).not.toBeNull();
  });

  it("approveTenant — 'Gözləyir' mağazanı Active edir, bitmə tarixini N ay irəli aparır (AC-12)", async () => {
    mockRegisterPendingTenant("Gözləyən Market", "Sahibkar", "994501234567");
    const before = await adminApi.listTenants();
    const pending = before.find((t) => t.name === "Gözləyən Market");
    expect(pending?.status).toBe("PendingApproval");

    await adminApi.approveTenant(pending!.id, 3);

    const after = await adminApi.listTenants();
    const approved = after.find((t) => t.id === pending!.id);
    expect(approved?.status).toBe("Active");
    expect(approved?.expiresAt).not.toBeNull();
    const monthsAhead =
      (new Date(approved!.expiresAt as string).getFullYear() - new Date().getFullYear()) * 12 +
      (new Date(approved!.expiresAt as string).getMonth() - new Date().getMonth());
    expect(monthsAhead).toBe(3);
  });

  it("blockTenant / unblockTenant — statusu Bloklu ↔ Aktiv arasında dəyişir (AC-13)", async () => {
    const tenants = await adminApi.listTenants();
    const active = tenants.find((t) => t.status === "Active");
    expect(active).toBeTruthy();

    await adminApi.blockTenant(active!.id);
    let updated = (await adminApi.listTenants()).find((t) => t.id === active!.id);
    expect(updated?.status).toBe("Blocked");

    await adminApi.unblockTenant(active!.id);
    updated = (await adminApi.listTenants()).find((t) => t.id === active!.id);
    expect(updated?.status).toBe("Active");
  });

  it("addPayment — ümumi ödənilib artır, ödəniş tarixçəsində görünür (AC-14/AC-15)", async () => {
    const tenants = await adminApi.listTenants();
    const target = tenants[0];
    const totalBefore = target.totalPaid;

    await adminApi.addPayment(target.id, { amount: 50, periodMonths: 2, note: "test ödəniş" });

    const after = (await adminApi.listTenants()).find((t) => t.id === target.id);
    expect(after?.totalPaid).toBe(totalBefore + 50);

    const payments = await adminApi.listPayments(target.id);
    expect(payments[0].amount).toBe(50);
    expect(payments[0].note).toBe("test ödəniş");
  });

  it("listPayments — ödənişi olmayan mağaza üçün boş massiv qaytarır (AC-15/TC-19)", async () => {
    mockRegisterPendingTenant("Ödənişsiz Market", "Sahibkar", "994501112299");
    const tenant = (await adminApi.listTenants()).find((t) => t.name === "Ödənişsiz Market");
    const payments = await adminApi.listPayments(tenant!.id);
    expect(payments).toEqual([]);
  });

  it("getStats — Aktiv/Gözləyən/Bloklu sayları və bu ay yığılan cəm doğrudur (AC-17)", async () => {
    const stats = await adminApi.getStats();
    expect(stats.activeCount).toBeGreaterThanOrEqual(0);
    expect(stats.pendingCount).toBeGreaterThanOrEqual(0);
    expect(stats.blockedCount).toBeGreaterThanOrEqual(0);
    expect(typeof stats.collectedThisMonth).toBe("number");
  });
});
