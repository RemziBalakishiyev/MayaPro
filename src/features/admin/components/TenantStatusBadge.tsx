import { Badge } from "@/components/ui/Badge";
import type { Tenant } from "../types";

/**
 * FE#183 (AC-11) — "Müddəti bitib" ayrıca backend statusu deyil:
 * `status==="Active" && isExpired===true` kombinasiyasıdır.
 */
export function tenantStatusLabel(t: Pick<Tenant, "status" | "isExpired">): string {
  if (t.status === "PendingApproval") return "Gözləyir";
  if (t.status === "Blocked") return "Bloklu";
  if (t.status === "Active" && t.isExpired) return "Müddəti bitib";
  return "Aktiv";
}

/**
 * Mağazalar cədvəlindəki status nişanı: Gözləyir=sarı, Aktiv=yaşıl,
 * Bloklu=qırmızı, Müddəti bitib=narıncı. Paylaşılan DS `Badge` primitivinə
 * (`components/ui/Badge.tsx`) delegasiya edir — `ProductStatusBadge` ilə eyni
 * naxış (ayrıca rəng xəritəsi/markup TƏKRARLANMIR).
 */
export function TenantStatusBadge({
  tenant,
}: {
  tenant: Pick<Tenant, "status" | "isExpired">;
}) {
  const label = tenantStatusLabel(tenant);
  return <Badge tone={label}>{label}</Badge>;
}
