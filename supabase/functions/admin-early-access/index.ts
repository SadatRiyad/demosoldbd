import { corsHeaders, json, requireAdmin } from "../_util/auth.ts";

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function sslConfigFromMode(v: string | undefined) {
  const mode = (v ?? "PREFERRED").toUpperCase();
  if (mode === "DISABLED") return undefined;
  return {};
}

async function getMysqlClient() {
  const { Client } = await import("https://deno.land/x/mysql@v2.12.1/mod.ts");
  const host = requireEnv("HOSTINGER_MYSQL_HOST");
  const port = Number(requireEnv("HOSTINGER_MYSQL_PORT"));
  const user = requireEnv("HOSTINGER_MYSQL_USER");
  const password = requireEnv("HOSTINGER_MYSQL_PASSWORD");
  const db = requireEnv("HOSTINGER_MYSQL_DATABASE");
  const tls = sslConfigFromMode(Deno.env.get("HOSTINGER_MYSQL_SSLMODE"));
  const clientConfig: Record<string, unknown> = { hostname: host, port, username: user, password, db };
  if (tls) clientConfig.tls = tls;
  return await new Client().connect(clientConfig as any);
}

async function ensureTables(client: any) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS early_access_signups (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return json(admin.status, { error: admin.error });

    if (req.method !== "GET") return json(405, { error: "Method not allowed" });

    const client = await getMysqlClient();
    await ensureTables(client);

    const rows = (await client.query(
      "SELECT id, email, created_at FROM early_access_signups ORDER BY created_at DESC LIMIT 200",
    )) as Array<{ id: number; email: string; created_at: string }>;
    await client.close();

    return json(200, {
      signups: rows.map((r) => ({ id: String(r.id), email: r.email, created_at: new Date(String(r.created_at)).toISOString() })),
    });
  } catch (err) {
    return json(500, { error: (err as Error).message });
  }
});
