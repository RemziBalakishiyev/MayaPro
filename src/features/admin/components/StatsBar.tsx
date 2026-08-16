import { Store, Clock, Ban, Wallet } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { fmtMoney } from "@/lib/format";
import type { PlatformStats } from "../types";

/** FE#183 (AC-17) — üst statistika: Aktiv N · Gözləyən N · Bloklu N · Bu ay yığılan X ₼. */
export function StatsBar({
  stats,
  isLoading,
}: {
  stats?: PlatformStats;
  isLoading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <StatCard
        label="Aktiv"
        value={isLoading ? "…" : (stats?.activeCount ?? 0)}
        icon={Store}
        tone="green"
      />
      <StatCard
        label="Gözləyən"
        value={isLoading ? "…" : (stats?.pendingCount ?? 0)}
        icon={Clock}
        tone="amber"
      />
      <StatCard
        label="Bloklu"
        value={isLoading ? "…" : (stats?.blockedCount ?? 0)}
        icon={Ban}
        tone="red"
      />
      <StatCard
        label="Bu ay yığılan"
        value={isLoading ? "…" : fmtMoney(stats?.collectedThisMonth ?? 0)}
        icon={Wallet}
        tone="indigo"
      />
    </div>
  );
}
