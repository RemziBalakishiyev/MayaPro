import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesApi, salaryApi, type NewSalaryEntryInput } from "./api";

export const employeeKeys = {
  all: ["employees"] as const,
  activity: ["activity"] as const,
  salarySummary: (month: string) => ["salary-summary", month] as const,
  salaryEntries: (employeeId: string, month: string) =>
    ["salary-entries", employeeId, month] as const,
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

/** Bütün işçilərin bir ay üçün maaş xülasəsi (kart görünüşünün əsas mənbəyi). */
export const useSalarySummary = (month: string) =>
  useQuery({
    queryKey: employeeKeys.salarySummary(month),
    queryFn: () => salaryApi.summary(month),
  });

/** Bir işçinin ayın sətirləri — "Tarixçə" draveri və kartdakı tutulma sətri üçün. */
export const useSalaryEntries = (
  employeeId: string,
  month: string,
  enabled = true,
) =>
  useQuery({
    queryKey: employeeKeys.salaryEntries(employeeId, month),
    queryFn: () => salaryApi.entries(employeeId, month),
    enabled: enabled && !!employeeId,
  });

/**
 * Maaş yazısı/silinməsi/dəyişikliyi bir işçinin YALNIZ öz ayına təsir edir,
 * amma kassa hesabına (gün sonu/dashboard) da düşə bilər (ödəniş növündə) —
 * ona görə bütün əlaqəli sorğular yenilənir.
 */
const invalidateSalarySideEffects = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["salary-summary"] });
  qc.invalidateQueries({ queryKey: ["salary-entries"] });
  qc.invalidateQueries({ queryKey: employeeKeys.all });
  qc.invalidateQueries({ queryKey: employeeKeys.activity });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["summary"] });
  qc.invalidateQueries({ queryKey: ["closings"] });
};

export const useCreateSalaryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      input,
    }: {
      employeeId: string;
      input: NewSalaryEntryInput;
    }) => salaryApi.createEntry(employeeId, input),
    onSuccess: () => invalidateSalarySideEffects(qc),
  });
};

export const useDeleteSalaryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      entryId,
    }: {
      employeeId: string;
      entryId: string;
    }) => salaryApi.deleteEntry(employeeId, entryId),
    onSuccess: () => invalidateSalarySideEffects(qc),
  });
};

export const useSetEmployeeSalary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      monthlySalary,
    }: {
      employeeId: string;
      monthlySalary: number;
    }) => salaryApi.setSalary(employeeId, monthlySalary),
    onSuccess: () => invalidateSalarySideEffects(qc),
  });
};
