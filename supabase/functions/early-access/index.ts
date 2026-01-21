// Public backend function: stores early access emails in Hostinger MySQL.

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function isValidEmail(email: string) {
  if (email.length > 255) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const client = await getMysqlClient();
    await ensureTables(client);

    // insert ignore handles duplicates
    await client.execute("INSERT IGNORE INTO early_access_signups (email) VALUES (?)", [email]);
    await client.close();

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
