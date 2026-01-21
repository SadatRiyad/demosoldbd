import { supabase } from "@/integrations/supabase/client";
import { API_MODE, NODE_API_BASE_URL, nodeFunctionPath } from "@/lib/api/config";

export type ApiInvokeOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

export type ApiResult<T> = { data: T | null; error: Error | null };

function withSlashTrim(v: string) {
  return v.replace(/\/+$/, "");
}

async function getAuthHeader(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? `Bearer ${token}` : null;
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
  const base = withSlashTrim(NODE_API_BASE_URL);
  if (!base) return { data: null, error: new Error("NODE_API_BASE_URL is not set") };

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
    const res = await fetchWithRetry(url, init, 2);
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
