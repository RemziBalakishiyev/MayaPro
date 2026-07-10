import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "./api";

export const employeeKeys = {
  all: ["employees"] as const,
  activity: ["activity"] as const,
};

export const useEmployees = () =>
  useQuery({
    queryKey: employeeKeys.all,
    queryFn: employeesApi.list,
  });

/** Fəaliyyət jurnalı — ən yeni əvvəldə (eyni gün üçün əlavə sırası qorunur). */
export const useActivity = () =>
  useQuery({
    queryKey: employeeKeys.activity,
    queryFn: employeesApi.activity,
    select: (rows) => [...rows].sort((a, b) => (a.date < b.date ? 1 : -1)),
  });
