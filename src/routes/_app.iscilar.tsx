import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/features/auth/store";
import { useEmployees } from "@/features/employees/queries";
import { SALARY_MONTH_RE } from "@/features/employees/lib";
import { EmployeesTable } from "@/features/employees/components/EmployeesTable";
import { ActivityLog } from "@/features/employees/components/ActivityLog";
import { SalaryBoard } from "@/features/employees/components/SalaryBoard";
import { EmployeesViewToggle } from "@/features/employees/components/EmployeesViewToggle";

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

function IscilarPage() {
  const navigate = Route.useNavigate();
  const { tab, month } = Route.useSearch();
  const {
    data: employees = [],
    isLoading,
    isError,
    dataUpdatedAt,
    refetch,
  } = useEmployees();
  const user = useAuthStore((s) => s.user);
  // FE#142: sorğu ən azı bir dəfə uğurla yüklənibmi — arxa-fon refetch
  // xətasında `DataTable`-ın "heç vaxt yüklənməyib" ilə "uğurla yüklənmiş
  // BOŞ siyahı" hallarını ayırd etməsi üçün.
  const hasLoadedOnce = dataUpdatedAt > 0 || employees.length > 0;

  // BE#28 qərarı: maaş bölməsi satıcı üçün tamamilə gizlidir (öz maaşını da
  // görmür) — tab özü belə göstərilmir, "Fəaliyyət" görünüşünə düşür.
  const canSeeSalary = user?.role !== "satici";
  const activeTab = canSeeSalary ? tab : "faaliyyet";

  return (
    <div>
      <PageHeader title="İşçilər" subtitle={`${employees.length} işçi`} />

      {canSeeSalary && (
        <div className="mb-5">
          <EmployeesViewToggle
            value={activeTab}
            onChange={(key) =>
              navigate({ search: (prev) => ({ ...prev, tab: key }) })
            }
          />
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
            <EmployeesTable
              employees={employees}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => void refetch()}
              hasLoadedOnce={hasLoadedOnce}
            />
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
