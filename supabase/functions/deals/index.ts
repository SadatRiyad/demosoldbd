// Public backend function: returns active deals from Hostinger MySQL.
// Uses server-side secrets (HOSTINGER_MYSQL_*). Safe for browser consumption.

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DealCategory = string;

type DealRow = {
  id: string;
  title: string;
  description: string | null;
  category: DealCategory;
  price_bdt: number | null;
  image_url: string;
  stock: number;
  ends_at: string; // MySQL DATETIME -> string
  is_active: 0 | 1;
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
  // Supported input examples: "DISABLED", "PREFERRED", "REQUIRED"
  const mode = (v ?? "PREFERRED").toUpperCase();
  if (mode === "DISABLED") return undefined;
  // deno_mysql expects a TLSConfig object.
  // Using an empty config enables TLS with default settings.
  return {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const client = await new Client().connect(clientConfig as any);

    const rows = (await client.query(
      `SELECT id, title, description, category, price_bdt, image_url, stock, ends_at, is_active
       FROM deals
       WHERE is_active = 1 AND ends_at > NOW()
       ORDER BY ends_at ASC`,
    )) as DealRow[];

    await client.close();

    // Normalize ends_at into ISO string so the frontend can use it directly.
    const deals = rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      description: r.description ?? "",
      category: r.category,
      priceBdt: typeof r.price_bdt === "number" ? r.price_bdt : r.price_bdt ? Number(r.price_bdt) : undefined,
      imageUrl: String(r.image_url),
      stock: Number(r.stock),
      endsAt: new Date(String(r.ends_at)).toISOString(),
    }));

    return new Response(JSON.stringify({ deals }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
