// Public backend function: returns site settings from Hostinger MySQL.

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

type SettingsRow = {
  id: number;
  brand_name: string;
  brand_tagline: string;
  header_kicker: string;
  hero_h1: string;
  hero_subtitle: string;
  whatsapp_phone_e164: string;
  whatsapp_default_message: string;
  next_drop_at: string | null;
  content_json: string;
};

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
    // supabase.functions.invoke() defaults to POST unless a method is provided.
    // Support both GET and POST for public reads.
    if (!(req.method === "GET" || req.method === "POST")) {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const client = await getMysqlClient();
    await ensureTables(client);

    const rows = (await client.query("SELECT * FROM site_settings WHERE id = 1 LIMIT 1")) as SettingsRow[];

    if (!rows?.length) {
      const defaults = {
        brand_name: "sold.bd",
        brand_tagline: "Bangladesh’s Flash Deals Marketplace",
        header_kicker: "Live drops • Limited stock",
        hero_h1: "Get it Before it’s Sold — Bangladesh’s Flash Deals Marketplace",
        hero_subtitle: "Limited-stock drops from local sellers. Miss it, it’s gone forever.",
        whatsapp_phone_e164: "+8801700000000",
        whatsapp_default_message: "Hi sold.bd! I want early access and updates about upcoming flash drops.",
        next_drop_at: null,
        content_json: JSON.stringify({
          features: [
            { title: "⏳ Limited Time Deals", desc: "Every drop has a clear timer — no guesswork." },
            { title: "📦 Limited Stock", desc: "Real stock counts. When it’s sold, it’s gone." },
            { title: "🇧🇩 Local Sellers", desc: "Curated deals from Bangladeshi merchants." },
            { title: "💬 WhatsApp Ordering", desc: "Fast ordering without complex checkout steps." },
          ],
          socialProof: [
            "Fast response on WhatsApp — got my deal confirmed in minutes.",
            "Stock was accurate. When it says 7 left, it’s real.",
          ],
          footerBlurb: "Limited-stock drops from local sellers. Miss it, it’s gone forever.",
          trustBlurb: "Transparent stock counts, clear deadlines, and fast WhatsApp ordering.",
        }),
      };

      await client.execute(
        `INSERT INTO site_settings
          (id, brand_name, brand_tagline, header_kicker, hero_h1, hero_subtitle, whatsapp_phone_e164, whatsapp_default_message, next_drop_at, content_json)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          defaults.brand_name,
          defaults.brand_tagline,
          defaults.header_kicker,
          defaults.hero_h1,
          defaults.hero_subtitle,
          defaults.whatsapp_phone_e164,
          defaults.whatsapp_default_message,
          defaults.next_drop_at,
          defaults.content_json,
        ],
      );

      const created = {
        id: "1",
        ...defaults,
        content: safeJsonParse(defaults.content_json),
        next_drop_at: defaults.next_drop_at,
      };

      await client.close();
      return new Response(JSON.stringify({ settings: created }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const r = rows[0];
    await client.close();

    return new Response(
      JSON.stringify({
        settings: {
          id: String(r.id),
          brand_name: r.brand_name,
          brand_tagline: r.brand_tagline,
          header_kicker: r.header_kicker,
          hero_h1: r.hero_h1,
          hero_subtitle: r.hero_subtitle,
          whatsapp_phone_e164: r.whatsapp_phone_e164,
          whatsapp_default_message: r.whatsapp_default_message,
          next_drop_at: r.next_drop_at ? new Date(r.next_drop_at).toISOString() : null,
          content: safeJsonParse(r.content_json ?? "{}"),
        },
      }),
      { headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
