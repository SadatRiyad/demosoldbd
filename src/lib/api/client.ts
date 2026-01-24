import { supabase } from "@/integrations/supabase/client";
import { API_MODE, NODE_API_BASE_URL, NODE_AUTH_REFRESH_PATH, nodeFunctionPath } from "@/lib/api/config";
import { getNodeAccessToken, refreshNodeSession } from "@/lib/api/nodeAuth";
import type { ApiRoutes, ApiFunctionName } from "@/lib/api/types";

export type ApiInvokeOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

export type ApiResult<T> = { data: T | null; error: Error | null };

function withSlashTrim(v: string) {
  return v.replace(/\/+$/, "");
}

function resolveNodeBaseUrl(): string {
  const explicit = withSlashTrim(NODE_API_BASE_URL ?? "");
  if (explicit) return explicit;

  // Safe browser-only fallback so production doesn't crash if env is missing.
  // Assumes split domains: sold.bd (frontend) + api.sold.bd (API).
  if (typeof window === "undefined") return "";
  const { protocol, hostname } = window.location;

  // Local dev convenience.
  if (hostname === "localhost" || hostname === "127.0.0.1") return "http://localhost:3001";

  const apiHost = hostname.startsWith("api.") ? hostname : `api.${hostname.replace(/^www\./, "")}`;
  return `${protocol}//${apiHost}`;
}

async function getAuthHeader(): Promise<string | null> {
  if (API_MODE === "node") {
    const token = getNodeAccessToken();
    return token ? `Bearer ${token}` : null;
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? `Bearer ${token}` : null;
}

function resolveRefreshUrl(baseUrl: string) {
  // Allow absolute URLs, otherwise treat as relative to base.
  if (/^https?:\/\//i.test(NODE_AUTH_REFRESH_PATH)) return NODE_AUTH_REFRESH_PATH;
  const base = withSlashTrim(baseUrl);
  const path = NODE_AUTH_REFRESH_PATH.startsWith("/") ? NODE_AUTH_REFRESH_PATH : `/${NODE_AUTH_REFRESH_PATH}`;
  return `${base}${path}`;
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.status >= 500 && attempt < retries) {
        await res.text().catch(() => undefined);
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt >= retries) throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Request failed");
}

async function invokeNode<T>(functionName: string, opts: ApiInvokeOptions = {}): Promise<ApiResult<T>> {
  const base = resolveNodeBaseUrl();
  if (!base) return { data: null, error: new Error("Node API base URL could not be resolved") };

  const url = `${base}${nodeFunctionPath(functionName)}`;
  const method = (opts.method ?? "POST").toUpperCase();
  const authHeader = await getAuthHeader();

  const headers: Record<string, string> = {
    ...(opts.headers ?? {}),
  };
  if (authHeader) headers.Authorization = authHeader;

  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
  if (!isForm && opts.body !== undefined) headers["content-type"] = headers["content-type"] ?? "application/json";

  const init: RequestInit = {
    method,
    headers,
    body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
  };

  try {
    let res = await fetchWithRetry(url, init, 2);

    // Node-mode: auto-refresh once on 401, then retry original request.
    if (res.status === 401) {
      const refreshed = await refreshNodeSession(resolveRefreshUrl(base));
      if (refreshed?.accessToken) {
        const retryHeaders = new Headers(init.headers);
        retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);
        res = await fetchWithRetry(url, { ...init, headers: retryHeaders }, 1);
      }
    }

    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const msg = (json as any)?.error ?? (res.statusText || "Request failed");
      return { data: null, error: new Error(String(msg)) };
    }
    return { data: json as T, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}

/**
 * Unified API entrypoint.
 * - In "lovable" mode: uses backend functions via the current provider.
 * - In "node" mode: calls your server endpoints with Authorization injection + retry.
 */
export async function apiInvoke<T>(functionName: string, opts: ApiInvokeOptions = {}): Promise<ApiResult<T>> {
  if (API_MODE === "node") return invokeNode<T>(functionName, opts);

  // Lovable Cloud backend functions
  const { data, error } = await supabase.functions.invoke<T>(functionName, {
    method: opts.method,
    body: opts.body,
    headers: opts.headers,
  } as any);
  return { data: data ?? null, error: (error as any) ?? null };
}

// -------------------------
// Typed overloads (optional but recommended)
// -------------------------

type MethodsFor<K extends ApiFunctionName> = keyof ApiRoutes[K] & string;

type RouteSpec = { body: unknown; response: unknown };
type SpecFor<K extends ApiFunctionName, M extends MethodsFor<K>> = ApiRoutes[K][M] extends RouteSpec ? ApiRoutes[K][M] : never;

export async function apiInvokeTyped<K extends ApiFunctionName, M extends MethodsFor<K>>(
  functionName: K,
  opts: {
    method: M;
    body: SpecFor<K, M>["body"];
    headers?: Record<string, string>;
  },
): Promise<ApiResult<SpecFor<K, M>["response"]>> {
  return apiInvoke<SpecFor<K, M>["response"]>(functionName, opts);
}
