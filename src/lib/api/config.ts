export type ApiMode = "lovable" | "node";

/**
 * Switch this to "node" when you move backend endpoints to your own server.
 * This should be the only file you need to change for the frontend to swap backends.
 */
export const API_MODE: ApiMode = "lovable";

/**
 * Used only when API_MODE === "node".
 * Example: https://api.yoursite.com
 */
export const NODE_API_BASE_URL = "";

/**
 * Used only when API_MODE === "node".
 * Example mapping: /api/deals, /api/admin-site-settings, etc.
 */
export function nodeFunctionPath(functionName: string) {
  return `/api/${functionName}`;
}
