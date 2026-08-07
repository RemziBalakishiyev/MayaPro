import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { employeeRoleLabel } from "../lib";
import type { Employee } from "@/types";

interface Props {
  employees: Employee[];
  isLoading?: boolean;
  /**
   * FE#142: işçi sorğusu şəbəkə/server xətası ilə uğursuz olduqda boş-siyahı
   * mesajı ("İşçi tapılmadı") ƏVƏZİNƏ `InlineError` + "Yenidən" göstərilir.
   */
  isError?: boolean;
  onRetry?: () => void;
  /**
   * FE#142: sorğu ən azı bir dəfə uğurla yükləndimi (məs. `dataUpdatedAt >
   * 0`) — arxa-fon refetch xətası ilə "heç vaxt yüklənməyib" halını ayırd
   * etmək üçün `DataTable`-a ötürülür (bax `DataTable`-dakı izah).
   */
  hasLoadedOnce?: boolean;
}

export function EmployeesTable({
  employees,
  isLoading,
  isError,
  onRetry,
  hasLoadedOnce,
}: Props) {
  const columns = useMemo<ColumnDef<Employee, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Ad",
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
                {e.name[0]}
              </div>
              <span className="font-semibold text-stone-900">{e.name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Rol",
        cell: ({ getValue }) => {
          const label = employeeRoleLabel(getValue() as string);
          return <Badge tone={label}>{label}</Badge>;
        },
      },
      {
        accessorKey: "phone",
        header: "Telefon",
        cell: ({ getValue }) => (
          <span className="text-xs">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <Badge tone={getValue() as string}>{getValue() as string}</Badge>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={employees}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      hasLoadedOnce={hasLoadedOnce}
      errorMessage="İşçilər yüklənmədi"
      emptyState={{ title: "İşçi tapılmadı" }}
    />
  );
}
