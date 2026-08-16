import { cn } from "@/lib/cn";
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

const TONE: Record<string, string> = {
  Gözləyir: "bg-amber-50 text-amber-800 ring-amber-200/70",
  Aktiv: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  Bloklu: "bg-red-50 text-red-700 ring-red-200/70",
  "Müddəti bitib": "bg-orange-50 text-orange-800 ring-orange-200/70",
};

/** Mağazalar cədvəlindəki status nişanı: Gözləyir=sarı, Aktiv=yaşıl, Bloklu=qırmızı, Müddəti bitib=narıncı. */
export function TenantStatusBadge({
  tenant,
}: {
  tenant: Pick<Tenant, "status" | "isExpired">;
}) {
  const label = tenantStatusLabel(tenant);
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium tracking-wide ring-1 ring-inset",
        TONE[label],
      )}
    >
      {label}
    </span>
  );
}
