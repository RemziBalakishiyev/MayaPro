/**
 * Employees + Activity API qatı — mock/real sərhədi.
 *
 * DTO uyğunsuzluğu: EmployeeDto {fullName, isActive} → frontend Employee
 * {name, status}. ActivityDto əlavə `userName` verir (frontend istifadə etmir),
 * employeeId nullable-dır.
 */
import { db } from "@/mocks/db";
import { salaryHandlers, type NewSalaryEntryInput } from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type {
  Employee,
  Activity,
  EmployeeSalarySummary,
  SalaryEntry,
} from "@/types";

interface EmployeeDto {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  /** BE#28 — additiv sahə, köhnə backend cavabında yoxdursa 0 sayılır. */
  monthlySalary?: number;
}

interface ActivityDto {
  id: string;
  employeeId: string | null;
  action: string;
  detail: string;
  userName: string | null;
  date: string;
}

const toEmployee = (d: EmployeeDto): Employee => ({
  id: d.id,
  name: d.fullName,
  phone: d.phone,
  role: d.role,
  status: d.isActive ? "Aktiv" : "Deaktiv",
  monthlySalary: d.monthlySalary ?? 0,
});

const toActivity = (d: ActivityDto): Activity => ({
  id: d.id,
  employeeId: d.employeeId ?? "",
  action: d.action,
  detail: d.detail,
  date: d.date,
});

export const employeesApi = {
  list: () =>
    USE_MOCK
      ? db.employees.list()
      : apiClient
          .get<EmployeeDto[]>("/api/employees")
          .then((rows) => rows.map(toEmployee)),

  activity: () =>
    USE_MOCK
      ? db.activity.list()
      : apiClient
          .get<ActivityDto[]>("/api/activity")
          .then((rows) => rows.map(toActivity)),
};

/** Ay sorğu parametri — "yyyy-MM"; boşdursa backend/mock cari mühasibat ayına düşür. */
const monthQuery = (month?: string): string => (month ? `?month=${month}` : "");

/**
 * Maaş API-si (BE#28) — wire sahələri (`userId`, `paidTotal`, `monthlySalary`
 * və s.) frontend tipləri ilə eyni addır, ona görə ayrıca DTO map-i lazım deyil.
 */
export const salaryApi = {
  /** Bütün işçilərin bir ay üçün maaş xülasəsi. */
  summary: (month?: string) =>
    USE_MOCK
      ? salaryHandlers.summary(month)
      : apiClient.get<EmployeeSalarySummary[]>(
          `/api/employees/salary-summary${monthQuery(month)}`,
        ),

  /** Bir işçinin ayın sətirləri, xronoloji (ən yeni əvvəldə). */
  entries: (employeeId: string, month?: string) =>
    USE_MOCK
      ? salaryHandlers.entries(employeeId, month)
      : apiClient.get<SalaryEntry[]>(
          `/api/employees/${employeeId}/salary-entries${monthQuery(month)}`,
        ),

  /** Ödəniş ("payment") və ya tutulma ("deduction") yazır. */
  createEntry: (employeeId: string, input: NewSalaryEntryInput) =>
    USE_MOCK
      ? salaryHandlers.createEntry(employeeId, input)
      : apiClient.post<SalaryEntry>(
          `/api/employees/${employeeId}/salary-entries`,
          {
            type: input.type,
            amount: input.amount,
            note: input.note || undefined,
            month: input.month || undefined,
          },
        ),

  /** Maaş sətrini silir (yalnız Sahibkar). */
  deleteEntry: (employeeId: string, entryId: string) =>
    USE_MOCK
      ? salaryHandlers.deleteEntry(employeeId, entryId)
      : apiClient.del<void>(
          `/api/employees/${employeeId}/salary-entries/${entryId}`,
        ),

  /** Aylıq maaş təyini (yalnız Sahibkar). */
  setSalary: (employeeId: string, monthlySalary: number) =>
    USE_MOCK
      ? salaryHandlers.setSalary(employeeId, monthlySalary)
      : apiClient
          .put<{ monthlySalary: number }>(`/api/employees/${employeeId}/salary`, {
            monthlySalary,
          })
          .then(() => undefined),
};

export type { NewSalaryEntryInput };
