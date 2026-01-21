export type NodeAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const LS_ACCESS = "soldbd:node:accessToken";
const LS_REFRESH = "soldbd:node:refreshToken";

export function getNodeAccessToken(): string | null {
  try {
    return localStorage.getItem(LS_ACCESS);
  } catch {
    return null;
  }
}

export function setNodeTokens(tokens: NodeAuthTokens) {
  try {
    localStorage.setItem(LS_ACCESS, tokens.accessToken);
    localStorage.setItem(LS_REFRESH, tokens.refreshToken);
  } catch {
    // ignore
  }
}

export function clearNodeTokens() {
  try {
    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_REFRESH);
  } catch {
    // ignore
  }
}

function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(LS_REFRESH);
  } catch {
    return null;
  }
}

/**
 * Calls your Node refresh endpoint.
 * Default expected shape: { accessToken, refreshToken }
 */
export async function refreshNodeSession(refreshUrl: string): Promise<NodeAuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(refreshUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as any;
  const accessToken = typeof json?.accessToken === "string" ? json.accessToken : null;
  const nextRefresh = typeof json?.refreshToken === "string" ? json.refreshToken : refreshToken;
  if (!accessToken) return null;

  const tokens = { accessToken, refreshToken: nextRefresh };
  setNodeTokens(tokens);
  return tokens;
}
