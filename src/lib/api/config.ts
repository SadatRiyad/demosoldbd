export type ApiMode = "lovable" | "node";

/**
 * Switch this to "node" when you move backend endpoints to your own server.
 * This should be the only file you need to change for the frontend to swap backends.
 */
function readApiMode(): ApiMode {
  const explicit = (import.meta.env.VITE_API_MODE as string | undefined)?.toLowerCase();
  if (explicit === "lovable" || explicit === "node") return explicit;
  // Default: dev -> lovable, prod -> node
  return import.meta.env.PROD ? "node" : "lovable";
}

/**
 * Backend switch:
 * - Default: dev => lovable, prod => node
 * - Override with VITE_API_MODE=lovable|node
 */
export const API_MODE: ApiMode = readApiMode();

/**
 * Used only when API_MODE === "node".
 * Example: https://api.yoursite.com
 */
export const NODE_API_BASE_URL = (import.meta.env.VITE_NODE_API_BASE_URL as string | undefined) ?? "";

/**
 * Node refresh endpoint (absolute or relative).
 * Default: /api/auth/refresh
 */
export const NODE_AUTH_REFRESH_PATH = (import.meta.env.VITE_NODE_AUTH_REFRESH_PATH as string | undefined) ?? "/api/auth/refresh";

/**
 * Used only when API_MODE === "node".
 * Example mapping: /api/deals, /api/admin-site-settings, etc.
 */
export function nodeFunctionPath(functionName: string) {
  return `/api/${functionName}`;
}
