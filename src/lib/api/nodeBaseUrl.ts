const LS_KEY = "soldbd_node_api_base_url";

function withSlashTrim(v: string) {
  return v.replace(/\/+$/, "");
}

function isLovablePreviewHost(hostname: string) {
  return hostname.endsWith(".lovable.app") || hostname.endsWith(".lovableproject.com");
}

export function getRuntimeNodeApiBaseUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    return withSlashTrim(String(window.localStorage.getItem(LS_KEY) ?? "").trim());
  } catch {
    return "";
  }
}

export function setRuntimeNodeApiBaseUrl(value: string) {
  if (typeof window === "undefined") return;
  const v = withSlashTrim(String(value ?? "").trim());
  try {
    if (!v) window.localStorage.removeItem(LS_KEY);
    else window.localStorage.setItem(LS_KEY, v);
  } catch {
    // ignore
  }
}

/**
 * Resolves the Node API base URL.
 * Priority:
 *  1) explicit env value (VITE_NODE_API_BASE_URL)
 *  2) runtime override (localStorage)
 *  3) localhost convenience
 *  4) api.<current-domain> (NOT in Lovable preview)
 */
export function resolveNodeApiBaseUrl(explicitEnv?: string): string {
  const explicit = withSlashTrim(String(explicitEnv ?? "").trim());
  if (explicit) return explicit;

  const runtime = getRuntimeNodeApiBaseUrl();
  if (runtime) return runtime;

  if (typeof window === "undefined") return "";
  const { protocol, hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") return "http://localhost:3001";
  if (isLovablePreviewHost(hostname)) return "";

  const apiHost = hostname.startsWith("api.") ? hostname : `api.${hostname.replace(/^www\./, "")}`;
  return `${protocol}//${apiHost}`;
}
