import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Wallet, Clock } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/features/auth/store";
import { useEmployees } from "@/features/employees/queries";
import { SALARY_MONTH_RE } from "@/features/employees/lib";
import { EmployeesTable } from "@/features/employees/components/EmployeesTable";
import { ActivityLog } from "@/features/employees/components/ActivityLog";
import { SalaryBoard } from "@/features/employees/components/SalaryBoard";

const searchSchema = z.object({
  tab: z.enum(["maaslar", "faaliyyet"]).default("maaslar").catch("maaslar"),
  /** Maaş ayı "yyyy-MM" — boşdursa/etibarsızdırsa SalaryBoard cari aya düşür. */
  month: z
    .string()
    .regex(SALARY_MONTH_RE)
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/_app/iscilar")({
  validateSearch: searchSchema,
  component: IscilarPage,
});

const TABS = [
  { key: "maaslar" as const, label: "Maaşlar", Icon: Wallet },
  { key: "faaliyyet" as const, label: "Fəaliyyət", Icon: Clock },
];

function IscilarPage() {
  const navigate = Route.useNavigate();
  const { tab, month } = Route.useSearch();
  const { data: employees = [], isLoading } = useEmployees();
  const user = useAuthStore((s) => s.user);

  // BE#28 qərarı: maaş bölməsi satıcı üçün tamamilə gizlidir (öz maaşını da
  // görmür) — tab özü belə göstərilmir, "Fəaliyyət" görünüşünə düşür.
  const canSeeSalary = user?.role !== "satici";
  const activeTab = canSeeSalary ? tab : "faaliyyet";

  return (
    <div>
      <PageHead title="İşçilər" subtitle={`${employees.length} işçi`} />

      {canSeeSalary && (
        <div
          role="tablist"
          aria-label="İşçilər görünüşü"
          className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md"
        >
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() =>
                  navigate({ search: (prev) => ({ ...prev, tab: key }) })
                }
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-colors",
                  active
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
                )}
              >
                <Icon size={18} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "maaslar" ? (
        <SalaryBoard
          month={month}
          onMonthChange={(m) =>
            navigate({ search: (prev) => ({ ...prev, month: m }) })
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <EmployeesTable employees={employees} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <Card title="Fəaliyyət jurnalı">
              <ActivityLog />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
