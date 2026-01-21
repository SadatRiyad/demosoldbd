import { corsHeaders, json, requireAdmin } from "../_util/auth.ts";

type Check = {
  key: string;
  label: string;
  ok: boolean;
  message?: string;
};

function isNonEmpty(v: string | undefined | null) {
  return Boolean(v && String(v).trim().length > 0);
}

function parsePort(raw: string) {
  const port = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(port) ? port : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return json(admin.status, { error: admin.error });

    if (req.method !== "GET") return json(405, { error: "Method not allowed" });

    const host = Deno.env.get("HOSTINGER_MYSQL_HOST") ?? "";
    const portRaw = Deno.env.get("HOSTINGER_MYSQL_PORT") ?? "";
    const user = Deno.env.get("HOSTINGER_MYSQL_USER") ?? "";
    const password = Deno.env.get("HOSTINGER_MYSQL_PASSWORD") ?? "";
    const db = Deno.env.get("HOSTINGER_MYSQL_DATABASE") ?? "";
    const sslMode = Deno.env.get("HOSTINGER_MYSQL_SSLMODE") ?? "";

    const port = isNonEmpty(portRaw) ? parsePort(portRaw) : null;
    const hostLooksLocal = host.trim() === "127.0.0.1" || host.trim().toLowerCase() === "localhost";

    const checks: Check[] = [
      {
        key: "HOSTINGER_MYSQL_HOST",
        label: "HOSTINGER_MYSQL_HOST",
        ok: isNonEmpty(host) && !hostLooksLocal,
        message: !isNonEmpty(host)
          ? "Missing"
          : hostLooksLocal
            ? "Should be your Hostinger DB host (e.g. srvXXXX.hstgr.io), not localhost/127.0.0.1"
            : undefined,
      },
      {
        key: "HOSTINGER_MYSQL_PORT",
        label: "HOSTINGER_MYSQL_PORT",
        ok: port !== null,
        message: port === null ? "Must be a number (usually 3306)" : undefined,
      },
      {
        key: "HOSTINGER_MYSQL_DATABASE",
        label: "HOSTINGER_MYSQL_DATABASE",
        ok: isNonEmpty(db),
        message: isNonEmpty(db) ? undefined : "Missing",
      },
      {
        key: "HOSTINGER_MYSQL_USER",
        label: "HOSTINGER_MYSQL_USER",
        ok: isNonEmpty(user),
        message: isNonEmpty(user) ? undefined : "Missing",
      },
      {
        key: "HOSTINGER_MYSQL_PASSWORD",
        label: "HOSTINGER_MYSQL_PASSWORD",
        ok: isNonEmpty(password),
        message: isNonEmpty(password) ? undefined : "Missing",
      },
      {
        key: "HOSTINGER_MYSQL_SSLMODE",
        label: "HOSTINGER_MYSQL_SSLMODE (optional)",
        ok: true,
        message: isNonEmpty(sslMode) ? "Set" : "Not set (defaults to PREFERRED)",
      },
    ];

    return json(200, { ok: true, checks });
  } catch (err) {
    return json(500, { error: (err as Error).message });
  }
});
