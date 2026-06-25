import { useSessionStore } from "@/stores/session";

export const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
export const USE_MOCKS =
  (import.meta.env.VITE_USE_MOCKS as string | undefined) !== "false" && !BASE_URL;

export const N8N_CHAT_WEBHOOK = (import.meta.env.VITE_N8N_CHAT_WEBHOOK as string | undefined) ?? "";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip auth header */
  anonymous?: boolean;
  /** Override base URL (used for the n8n direct bypass). */
  baseUrl?: string;
}

/**
 * Thin wrapper around fetch. Replace the body of this function or
 * the underlying api/*.ts modules to wire the real backend.
 */
export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { body, anonymous, baseUrl, headers, ...rest } = opts;
  const base = baseUrl ?? BASE_URL;
  const url = `${base}${path}`;

  const token = useSessionStore.getState().token;

  const init: RequestInit = {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(!anonymous && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  };

  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new ApiError(
      (data && typeof data === "object" && "message" in data
        ? String((data as Record<string, unknown>).message)
        : res.statusText) || "Request failed",
      res.status,
      data,
    );
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Helper for mock latency — keeps the "Interval" feel during dev. */
export const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Lightweight UUID v4-ish for mocks. */
export const mockId = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
