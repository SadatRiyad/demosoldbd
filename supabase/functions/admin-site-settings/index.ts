import { corsHeaders, json, requireAdmin } from "../_util/auth.ts";

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function requirePort(name: string) {
  const raw = requireEnv(name).trim();
  const port = Number.parseInt(raw, 10);
  if (!Number.isFinite(port)) throw new Error(`Invalid port for ${name}: ${raw}`);
  return port;
}

function sslConfigFromMode(v: string | undefined) {
  const mode = (v ?? "PREFERRED").toUpperCase();
  if (mode === "DISABLED") return undefined;
  return {};
}

async function getMysqlClient() {
  const { Client } = await import("https://deno.land/x/mysql@v2.12.1/mod.ts");

  const host = requireEnv("HOSTINGER_MYSQL_HOST");
  const port = requirePort("HOSTINGER_MYSQL_PORT");
  const user = requireEnv("HOSTINGER_MYSQL_USER");
  const password = requireEnv("HOSTINGER_MYSQL_PASSWORD");
  const db = requireEnv("HOSTINGER_MYSQL_DATABASE");
  const tls = sslConfigFromMode(Deno.env.get("HOSTINGER_MYSQL_SSLMODE"));

  const clientConfig: Record<string, unknown> = {
    hostname: host,
    port,
    username: user,
    password,
    db,
  };
  if (tls) clientConfig.tls = tls;
  return await new Client().connect(clientConfig as any);
}

async function ensureTables(client: any) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INT NOT NULL PRIMARY KEY,
      brand_name VARCHAR(60) NOT NULL,
      brand_tagline VARCHAR(120) NOT NULL,
      header_kicker VARCHAR(80) NOT NULL,
      hero_h1 VARCHAR(160) NOT NULL,
      hero_subtitle VARCHAR(240) NOT NULL,
      whatsapp_phone_e164 VARCHAR(20) NOT NULL,
      whatsapp_default_message VARCHAR(500) NOT NULL,
      next_drop_at DATETIME NULL,
      content_json TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
}

function safeJsonParse(v: string) {
  try {
    return JSON.parse(v);
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return json(admin.status, { error: admin.error });

    const body = (await req.json().catch(() => ({}))) as any;
    const client = await getMysqlClient();
    await ensureTables(client);

    // Ensure row exists
    await client.execute(
      `INSERT IGNORE INTO site_settings
       (id, brand_name, brand_tagline, header_kicker, hero_h1, hero_subtitle, whatsapp_phone_e164, whatsapp_default_message, next_drop_at, content_json)
       VALUES (1, 'sold.bd', 'Bangladesh’s Flash Deals Marketplace', 'Live drops • Limited stock',
               'Get it Before it’s Sold — Bangladesh’s Flash Deals Marketplace',
               'Limited-stock drops from local sellers. Miss it, it’s gone forever.',
               '+8801700000000',
               'Hi sold.bd! I want early access and updates about upcoming flash drops.',
               NULL,
               '{}')
      `,
    );

    if (req.method === "PUT") {
      await client.execute(
        `UPDATE site_settings SET
          brand_name=?,
          brand_tagline=?,
          header_kicker=?,
          hero_h1=?,
          hero_subtitle=?,
          whatsapp_phone_e164=?,
          whatsapp_default_message=?,
          next_drop_at=?
         WHERE id=1`,
        [
          String(body.brand_name ?? "sold.bd"),
          String(body.brand_tagline ?? ""),
          String(body.header_kicker ?? ""),
          String(body.hero_h1 ?? ""),
          String(body.hero_subtitle ?? ""),
          String(body.whatsapp_phone_e164 ?? ""),
          String(body.whatsapp_default_message ?? ""),
          body.next_drop_at ? new Date(String(body.next_drop_at)) : null,
        ],
      );

      await client.close();
      return json(200, { ok: true });
    }

    if (req.method === "PATCH") {
      const patch = (body?.content_patch ?? {}) as Record<string, unknown>;
      const rows = (await client.query("SELECT content_json FROM site_settings WHERE id=1 LIMIT 1")) as Array<{ content_json: string }>;
      const current = safeJsonParse(rows?.[0]?.content_json ?? "{}");
      const merged = { ...current, ...patch };
      await client.execute("UPDATE site_settings SET content_json=? WHERE id=1", [JSON.stringify(merged)]);
      await client.close();
      return json(200, { ok: true });
    }

    await client.close();
    return json(405, { error: "Method not allowed" });
  } catch (err) {
    return json(500, { error: (err as Error).message });
  }
});
