/**
 * Employees + Activity API qatı — mock/real sərhədi.
 *
 * DTO uyğunsuzluğu: EmployeeDto {fullName, isActive} → frontend Employee
 * {name, status}. ActivityDto əlavə `userName` verir (frontend istifadə etmir),
 * employeeId nullable-dır.
 */
import { db } from "@/mocks/db";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { Employee, Activity } from "@/types";

interface EmployeeDto {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
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
