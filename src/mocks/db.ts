/**
 * localStorage-da saxlanılan mock "verilənlər bazası".
 * Bütün əməliyyatlar süni 300ms gecikmə ilə real şəbəkə hissi verir.
 */

const STORAGE_KEY = "sederek-db";

export const sleep = (ms = 300) => new Promise((r) => setTimeout(r, ms));

type DbShape = Record<string, unknown[]>;

const read = (): DbShape => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DbShape) : {};
  } catch {
    return {};
  }
};

const write = (data: DbShape) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const db = { read, write, sleep, STORAGE_KEY };
