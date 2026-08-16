/**
 * FE#183 — platforma admin paneli tipləri (BE#36 `TenancyDtos.cs`, camelCase JSON).
 */

/** Backend `TenantStatus` enum-u — yalnız bu üç dəyəri qaytarır. */
export type TenantStatus = "PendingApproval" | "Active" | "Blocked";

/**
 * Cədvəldəki 4-cü görünüş ("Müddəti bitib") backend statusundan DEYİL,
 * `Active` + `isExpired=true` kombinasiyasından gəlir (bax `tenantStatusLabel`).
 */
export type TenantFilterStatus = "PendingApproval" | "Active" | "Blocked" | "Expired";

export interface Tenant {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  status: TenantStatus;
  /** ISO tarix-vaxt — `null` isə mağaza vaxtsız (heç vaxt bitmir). */
  expiresAt: string | null;
  monthlyFee: number;
  /** `status==="Active"` olsa belə ödənişli müddət keçibsə `true`. */
  isExpired: boolean;
  lastPaymentAt: string | null;
  lastPaymentAmount: number | null;
  totalPaid: number;
}

export interface TenantPayment {
  id: string;
  tenantId: string;
  amount: number;
  /** ISO tarix-vaxt. */
  paidAt: string;
  periodMonths: number;
  note: string | null;
}

export interface PlatformStats {
  activeCount: number;
  pendingCount: number;
  blockedCount: number;
  expiredCount: number;
  collectedThisMonth: number;
}
