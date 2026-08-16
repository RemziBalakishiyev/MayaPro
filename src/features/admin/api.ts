/**
 * FE#183 — platforma admin paneli API qatı (mock/real sərhədi).
 *
 * Backend (BE#36) `AdminTenantsEndpoints.cs` / `TenancyDtos.cs`:
 * - GET  /api/admin/tenants?status=&search=   → TenantListItemDto[]
 * - POST /api/admin/tenants                   → TenantListItemDto (yeni, dərhal Active)
 * - POST /api/admin/tenants/{id}/approve      → TenantSummaryDto  (body: periodMonths)
 * - POST /api/admin/tenants/{id}/block        → TenantSummaryDto
 * - POST /api/admin/tenants/{id}/unblock      → TenantSummaryDto
 * - POST /api/admin/tenants/{id}/payments     → TenantSummaryDto  (body: amount, periodMonths, note)
 * - GET  /api/admin/tenants/{id}/payments     → SubscriptionPaymentDto[]
 * - GET  /api/admin/stats                     → PlatformStatsDto
 *
 * Status filtri backend-ə göndərilmir — "Müddəti bitib" (Expired) backend statusu DEYİL,
 * `Active && isExpired` kombinasiyasıdır, ona görə bütün siyahı çəkilib LOKAL filtrlənir
 * (digər siyahı səhifələri ilə eyni naxış, bax `_app.musteriler.tsx`).
 */
import { apiClient, USE_MOCK } from "@/lib/api-client";
import { sleep } from "@/mocks/db";
import { uid, todayISO } from "@/lib/format";
import type { PlatformStats, Tenant, TenantPayment, TenantStatus } from "./types";

// ——— Backend DTO-ları (camelCase JSON) ———
interface TenantListItemDto {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  status: string;
  expiresAt: string | null;
  monthlyFee: number;
  isExpired: boolean;
  lastPaymentAt: string | null;
  lastPaymentAmount: number | null;
  totalPaid: number;
}

interface TenantSummaryDto {
  id: string;
  name: string;
  status: string;
  expiresAt: string | null;
  monthlyFee: number;
  isExpired: boolean;
}

interface SubscriptionPaymentDto {
  id: string;
  tenantId: string;
  amount: number;
  paidAt: string;
  periodMonths: number;
  note: string | null;
  recordedByAdminId: string | null;
}

interface PlatformStatsDto {
  activeCount: number;
  pendingCount: number;
  blockedCount: number;
  expiredCount: number;
  collectedThisMonth: number;
}

export interface NewTenantInput {
  storeName: string;
  ownerName: string;
  phone: string;
  password: string;
  /** Boş buraxılarsa mağaza vaxtsız (heç vaxt bitmir) yaradılır. */
  periodMonths?: number;
  monthlyFee?: number;
}

export interface RecordPaymentInput {
  amount: number;
  periodMonths: number;
  note?: string;
}

const toTenant = (d: TenantListItemDto): Tenant => ({
  id: d.id,
  name: d.name,
  ownerName: d.ownerName,
  phone: d.phone,
  status: d.status as TenantStatus,
  expiresAt: d.expiresAt,
  monthlyFee: d.monthlyFee,
  isExpired: d.isExpired,
  lastPaymentAt: d.lastPaymentAt,
  lastPaymentAmount: d.lastPaymentAmount,
  totalPaid: d.totalPaid,
});

const toPayment = (d: SubscriptionPaymentDto): TenantPayment => ({
  id: d.id,
  tenantId: d.tenantId,
  amount: d.amount,
  paidAt: d.paidAt,
  periodMonths: d.periodMonths,
  note: d.note,
});

const toStats = (d: PlatformStatsDto): PlatformStats => ({
  activeCount: d.activeCount,
  pendingCount: d.pendingCount,
  blockedCount: d.blockedCount,
  expiredCount: d.expiredCount,
  collectedThisMonth: d.collectedThisMonth,
});

// ——— Mock (localStorage) — yalnız VITE_API_URL boş olanda (demo rejim) ———
const MOCK_DB_KEY = "sederek-admin-tenants-db";

interface MockTenantRow {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  status: TenantStatus;
  expiresAt: string | null;
  monthlyFee: number;
  createdAt: string;
}

interface MockPaymentRow {
  id: string;
  tenantId: string;
  amount: number;
  paidAt: string;
  periodMonths: number;
  note: string | null;
}

interface MockAdminDb {
  tenants: MockTenantRow[];
  payments: MockPaymentRow[];
}

function seedMockDb(): MockAdminDb {
  const now = Date.now();
  const day = 86400000;
  const iso = (offsetDays: number) => new Date(now + offsetDays * day).toISOString();
  return {
    tenants: [
      {
        id: uid("tnt"),
        name: "Sədərək Market",
        ownerName: "Elvin Məmmədov",
        phone: "994501112233",
        status: "Active",
        expiresAt: iso(20),
        monthlyFee: 30,
        createdAt: todayISO(),
      },
      {
        id: uid("tnt"),
        name: "Naxçıvan Ticarət",
        ownerName: "Rəna Əliyeva",
        phone: "994552223344",
        status: "Active",
        expiresAt: iso(3),
        monthlyFee: 25,
        createdAt: todayISO(),
      },
      {
        id: uid("tnt"),
        name: "Ulduz Market",
        ownerName: "Vüqar Hüseynov",
        phone: "994553334455",
        status: "PendingApproval",
        expiresAt: null,
        monthlyFee: 0,
        createdAt: todayISO(),
      },
      {
        id: uid("tnt"),
        name: "Zirvə Supermarket",
        ownerName: "Aygün Quliyeva",
        phone: "994504445566",
        status: "Blocked",
        expiresAt: null,
        monthlyFee: 20,
        createdAt: todayISO(),
      },
      {
        id: uid("tnt"),
        name: "Qarnizon Mağazası",
        ownerName: "Tural Səfərov",
        phone: "994505556677",
        status: "Active",
        expiresAt: iso(-1),
        monthlyFee: 20,
        createdAt: todayISO(),
      },
    ],
    payments: [],
  };
}

function readMockDb(): MockAdminDb {
  const raw = localStorage.getItem(MOCK_DB_KEY);
  if (!raw) {
    const seeded = seedMockDb();
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as MockAdminDb;
  } catch {
    const seeded = seedMockDb();
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeMockDb(db: MockAdminDb): void {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
}

/**
 * FE#183 — `authApi.register` (mock) yeni mağazanı bura əlavə edir ki, admin
 * panelində "Gözləyir" statusu ilə görünsün (TC-14 uçdan-uca ssenarisi mock
 * rejimdə də işləsin deyə).
 */
export function mockRegisterPendingTenant(
  storeName: string,
  ownerName: string,
  phone: string,
): void {
  const db = readMockDb();
  db.tenants = [
    {
      id: uid("tnt"),
      name: storeName,
      ownerName,
      phone,
      status: "PendingApproval",
      expiresAt: null,
      monthlyFee: 0,
      createdAt: todayISO(),
    },
    ...db.tenants,
  ];
  writeMockDb(db);
}

function mockToTenant(row: MockTenantRow, payments: MockPaymentRow[]): Tenant {
  const now = Date.now();
  const tenantPayments = payments
    .filter((p) => p.tenantId === row.id)
    .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
  const last = tenantPayments[0];
  return {
    id: row.id,
    name: row.name,
    ownerName: row.ownerName,
    phone: row.phone,
    status: row.status,
    expiresAt: row.expiresAt,
    monthlyFee: row.monthlyFee,
    isExpired:
      row.status === "Active" && !!row.expiresAt && new Date(row.expiresAt).getTime() <= now,
    lastPaymentAt: last?.paidAt ?? null,
    lastPaymentAmount: last?.amount ?? null,
    totalPaid: tenantPayments.reduce((sum, p) => sum + p.amount, 0),
  };
}

async function mockListTenants(search?: string): Promise<Tenant[]> {
  await sleep();
  const db = readMockDb();
  const q = search?.trim().toLowerCase();
  const rows = q
    ? db.tenants.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.ownerName.toLowerCase().includes(q) ||
          t.phone.includes(q),
      )
    : db.tenants;
  return rows.map((r) => mockToTenant(r, db.payments));
}

async function mockCreateTenant(input: NewTenantInput): Promise<Tenant> {
  await sleep();
  const db = readMockDb();
  let expiresAt: string | null = null;
  if (input.periodMonths) {
    const d = new Date();
    d.setMonth(d.getMonth() + input.periodMonths);
    expiresAt = d.toISOString();
  }
  const row: MockTenantRow = {
    id: uid("tnt"),
    name: input.storeName.trim(),
    ownerName: input.ownerName.trim(),
    phone: input.phone.trim(),
    status: "Active",
    expiresAt,
    monthlyFee: input.monthlyFee ?? 0,
    createdAt: todayISO(),
  };
  db.tenants = [row, ...db.tenants];
  writeMockDb(db);
  return mockToTenant(row, db.payments);
}

async function mockApprove(id: string, periodMonths: number): Promise<Tenant> {
  await sleep();
  const db = readMockDb();
  let updated: MockTenantRow | undefined;
  db.tenants = db.tenants.map((t) => {
    if (t.id !== id) return t;
    const d = new Date();
    d.setMonth(d.getMonth() + periodMonths);
    updated = { ...t, status: "Active", expiresAt: d.toISOString() };
    return updated;
  });
  if (!updated) throw new Error("Mağaza tapılmadı");
  writeMockDb(db);
  return mockToTenant(updated, db.payments);
}

async function mockSetStatus(id: string, status: "Active" | "Blocked"): Promise<Tenant> {
  await sleep();
  const db = readMockDb();
  let updated: MockTenantRow | undefined;
  db.tenants = db.tenants.map((t) => {
    if (t.id !== id) return t;
    updated = { ...t, status };
    return updated;
  });
  if (!updated) throw new Error("Mağaza tapılmadı");
  writeMockDb(db);
  return mockToTenant(updated, db.payments);
}

async function mockAddPayment(id: string, input: RecordPaymentInput): Promise<Tenant> {
  await sleep();
  const db = readMockDb();
  const tenant = db.tenants.find((t) => t.id === id);
  if (!tenant) throw new Error("Mağaza tapılmadı");
  const now = new Date();
  const base =
    tenant.expiresAt && new Date(tenant.expiresAt) > now ? new Date(tenant.expiresAt) : now;
  base.setMonth(base.getMonth() + input.periodMonths);
  const payment: MockPaymentRow = {
    id: uid("pay"),
    tenantId: id,
    amount: input.amount,
    paidAt: now.toISOString(),
    periodMonths: input.periodMonths,
    note: input.note?.trim() || null,
  };
  db.payments = [payment, ...db.payments];
  let updated: MockTenantRow | undefined;
  db.tenants = db.tenants.map((t) => {
    if (t.id !== id) return t;
    updated = { ...t, expiresAt: base.toISOString() };
    return updated;
  });
  writeMockDb(db);
  return mockToTenant(updated as MockTenantRow, db.payments);
}

async function mockListPayments(id: string): Promise<TenantPayment[]> {
  await sleep();
  const db = readMockDb();
  return db.payments
    .filter((p) => p.tenantId === id)
    .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1))
    .map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      amount: p.amount,
      paidAt: p.paidAt,
      periodMonths: p.periodMonths,
      note: p.note,
    }));
}

async function mockGetStats(): Promise<PlatformStats> {
  await sleep();
  const db = readMockDb();
  const now = Date.now();
  const activeCount = db.tenants.filter(
    (t) => t.status === "Active" && !(t.expiresAt && new Date(t.expiresAt).getTime() <= now),
  ).length;
  const pendingCount = db.tenants.filter((t) => t.status === "PendingApproval").length;
  const blockedCount = db.tenants.filter((t) => t.status === "Blocked").length;
  const expiredCount = db.tenants.filter(
    (t) => t.status === "Active" && t.expiresAt && new Date(t.expiresAt).getTime() <= now,
  ).length;
  const thisMonth = new Date();
  const collectedThisMonth = db.payments
    .filter((p) => {
      const d = new Date(p.paidAt);
      return (
        d.getFullYear() === thisMonth.getFullYear() && d.getMonth() === thisMonth.getMonth()
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);
  return { activeCount, pendingCount, blockedCount, expiredCount, collectedThisMonth };
}

export const adminApi = {
  listTenants: (search?: string): Promise<Tenant[]> =>
    USE_MOCK
      ? mockListTenants(search)
      : apiClient
          .get<TenantListItemDto[]>(
            `/api/admin/tenants${search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`,
          )
          .then((rows) => rows.map(toTenant)),

  createTenant: (input: NewTenantInput): Promise<Tenant> =>
    USE_MOCK
      ? mockCreateTenant(input)
      : apiClient
          .post<TenantListItemDto>("/api/admin/tenants", {
            storeName: input.storeName.trim(),
            ownerName: input.ownerName.trim(),
            phone: input.phone.trim(),
            password: input.password,
            periodMonths: input.periodMonths ?? null,
            monthlyFee: input.monthlyFee ?? null,
          })
          .then(toTenant),

  approveTenant: (id: string, periodMonths: number): Promise<void> =>
    USE_MOCK
      ? mockApprove(id, periodMonths).then(() => undefined)
      : apiClient
          .post<TenantSummaryDto>(`/api/admin/tenants/${id}/approve`, { periodMonths })
          .then(() => undefined),

  blockTenant: (id: string): Promise<void> =>
    USE_MOCK
      ? mockSetStatus(id, "Blocked").then(() => undefined)
      : apiClient.post<TenantSummaryDto>(`/api/admin/tenants/${id}/block`).then(() => undefined),

  unblockTenant: (id: string): Promise<void> =>
    USE_MOCK
      ? mockSetStatus(id, "Active").then(() => undefined)
      : apiClient
          .post<TenantSummaryDto>(`/api/admin/tenants/${id}/unblock`)
          .then(() => undefined),

  addPayment: (id: string, input: RecordPaymentInput): Promise<void> =>
    USE_MOCK
      ? mockAddPayment(id, input).then(() => undefined)
      : apiClient
          .post<TenantSummaryDto>(`/api/admin/tenants/${id}/payments`, {
            amount: input.amount,
            periodMonths: input.periodMonths,
            note: input.note?.trim() || null,
          })
          .then(() => undefined),

  listPayments: (id: string): Promise<TenantPayment[]> =>
    USE_MOCK
      ? mockListPayments(id)
      : apiClient
          .get<SubscriptionPaymentDto[]>(`/api/admin/tenants/${id}/payments`)
          .then((rows) => rows.map(toPayment)),

  getStats: (): Promise<PlatformStats> =>
    USE_MOCK
      ? mockGetStats()
      : apiClient.get<PlatformStatsDto>("/api/admin/stats").then(toStats),
};
