import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/layout/PageHead";
import { Card } from "@/components/ui/Card";
import { useEmployees } from "@/features/employees/queries";
import { EmployeesTable } from "@/features/employees/components/EmployeesTable";
import { ActivityLog } from "@/features/employees/components/ActivityLog";

export const Route = createFileRoute("/_app/iscilar")({
  component: IscilarPage,
});

function IscilarPage() {
  const { data: employees = [], isLoading } = useEmployees();

  return (
    <div>
      <PageHead
        title="İşçilər"
        subtitle={`${employees.length} işçi · fəaliyyət jurnalı`}
      />
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
    </div>
  );
}
