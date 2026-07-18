/**
 * Real backend üçün fetch wrapper.
 *
 * - baseURL: VITE_API_URL (origin, sonda "/api" OLMADAN) — yol hər çağırışda
 *   tam verilir, məs. apiClient.get("/api/products").
 * - Hər sorğuya auth store-dakı token → Authorization: Bearer <token>.
 * - Cavab konvensiyası: uğur → JSON body; xəta → { code, message }.
 *   message ApiError-ə daşınır ki, mutation onError-larda toast.error(err.message)
 *   Azərbaycanca mesajı göstərsin.
 * - 401 → auth store logout + /login-ə yönləndirmə.
 *
 * VITE_API_URL boş olanda USE_MOCK=true → feature api.ts-lər mock qatına düşür.
 */
import { useAuthStore } from "@/features/auth/store";

/** Sondakı "/" təmizlənmiş backend origin-i (boş ola bilər → mock rejimi). */
export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/** VITE_API_URL yoxdursa mock/demo rejimi. */
export const USE_MOCK = !API_URL;

/** Backend-in { code, message } xətasını daşıyan tip. */
export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/** 401-də çağırılacaq handler (main.tsx routing ilə bağlaya bilər). */
let unauthorizedHandler: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void): void => {
  unauthorizedHandler = fn;
};

type Method = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  const hasBody = body !== undefined;
  if (hasBody) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    if (unauthorizedHandler) unauthorizedHandler();
    else if (typeof window !== "undefined") window.location.assign("/login");
    throw new ApiError(
      "Sessiya bitib. Yenidən daxil olun.",
      "Auth.Unauthorized",
      401,
    );
  }

  // 204 No Content (məs. GET /api/closings/today boş olanda)
  if (res.status === 204) return null as T;

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const err = (data ?? {}) as { code?: string; message?: string };
    throw new ApiError(
      err.message ?? "Serverlə əlaqədə xəta baş verdi.",
      err.code ?? "General.Error",
      res.status,
    );
  }

  return data as T;
}

/**
 * Binary cavab (Excel/PDF export) — JSON parse etmir.
 * Content-Disposition header-i filename üçün saxlanılır.
 */
async function requestBlob(
  path: string,
): Promise<{ blob: Blob; contentDisposition: string | null }> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { method: "GET", headers });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    if (unauthorizedHandler) unauthorizedHandler();
    else if (typeof window !== "undefined") window.location.assign("/login");
    throw new ApiError(
      "Sessiya bitib. Yenidən daxil olun.",
      "Auth.Unauthorized",
      401,
    );
  }

  if (!res.ok) {
    let message = "Serverlə əlaqədə xəta baş verdi.";
    let code = "General.Error";
    try {
      const err = (await res.json()) as { code?: string; message?: string };
      if (err.message) message = err.message;
      if (err.code) code = err.code;
    } catch {
      /* binary / boş body */
    }
    throw new ApiError(message, code, res.status);
  }

  return {
    blob: await res.blob(),
    contentDisposition: res.headers.get("Content-Disposition"),
  };
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>("GET", path),
  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>("PUT", path, body),
  del: <T>(path: string): Promise<T> => request<T>("DELETE", path),
  getBlob: (
    path: string,
  ): Promise<{ blob: Blob; contentDisposition: string | null }> =>
    requestBlob(path),
};
