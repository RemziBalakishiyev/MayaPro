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

/** Ortaq fetch başlıqları (token + body varsa Content-Type). */
function buildInit(method: Method, body: unknown): RequestInit {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  const hasBody = body !== undefined;
  if (hasBody) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  };
}

/** 401 → logout + login-ə yönləndirmə. Həmişə ApiError atır. */
function throwUnauthorized(): never {
  useAuthStore.getState().logout();
  if (unauthorizedHandler) unauthorizedHandler();
  else if (typeof window !== "undefined") window.location.assign("/login");
  throw new ApiError(
    "Sessiya bitib. Yenidən daxil olun.",
    "Auth.Unauthorized",
    401,
  );
}

/** Sətri JSON kimi oxumağa çalışır; alınmasa xam sətri qaytarır. */
function parseMaybeJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Backend-in { code, message } xəta bədənindən ApiError qurur. */
function toApiError(data: unknown, status: number): ApiError {
  const err = (typeof data === "object" && data !== null ? data : {}) as {
    code?: string;
    message?: string;
  };
  return new ApiError(
    err.message ?? "Serverlə əlaqədə xəta baş verdi.",
    err.code ?? "General.Error",
    status,
  );
}

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, buildInit(method, body));

  if (res.status === 401) throwUnauthorized();

  // 204 No Content (məs. GET /api/closings/today boş olanda)
  if (res.status === 204) return null as T;

  const data = parseMaybeJson(await res.text());

  if (!res.ok) throw toApiError(data, res.status);

  return data as T;
}

/**
 * Multipart form-data POST (fayl yükləmə, məs. Excel import preview).
 * Content-Type başlığı bilərəkdən qoyulmur — brauzer FormData üçün özü
 * boundary-li multipart/form-data başlığını təyin edir, əl ilə yazılsa boundary
 * itir və server body-ni parse edə bilmir.
 */
async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401) throwUnauthorized();

  const data = parseMaybeJson(await res.text());

  if (!res.ok) throw toApiError(data, res.status);

  return data as T;
}

export interface BlobResponse {
  blob: Blob;
  contentDisposition: string | null;
}

/**
 * Binary cavab (Excel/PDF export) — uğurda JSON parse etmir.
 * Content-Disposition header-i filename üçün saxlanılır.
 * GET (parametrsiz) və POST (JSON body ilə, məs. etiket PDF-i) hər ikisini dəstəkləyir.
 *
 * Xəta halında backend blob yerinə { code, message } JSON-u qaytarır — ona görə
 * uğursuz cavabın bədəni mətn kimi oxunub JSON-a çevrilir ki, toast-larda
 * Azərbaycanca mesaj (məs. "Bu malların barkodu yoxdur: ...") görünsün.
 */
async function requestBlob(
  method: Method,
  path: string,
  body?: unknown,
): Promise<BlobResponse> {
  const res = await fetch(`${API_URL}${path}`, buildInit(method, body));

  if (res.status === 401) throwUnauthorized();

  if (!res.ok) {
    // Blob cavabında da xəta bədəni JSON-dur; JSON deyilsə (HTML/boş)
    // toApiError ümumi mesaja düşür.
    const text = await res.text().catch(() => "");
    throw toApiError(parseMaybeJson(text), res.status);
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
  getBlob: (path: string): Promise<BlobResponse> => requestBlob("GET", path),
  postBlob: (path: string, body?: unknown): Promise<BlobResponse> =>
    requestBlob("POST", path, body),
  postForm: <T>(path: string, formData: FormData): Promise<T> =>
    requestForm<T>(path, formData),
};
