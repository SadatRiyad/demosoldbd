import { corsHeaders, json, requireAdmin } from "../_util/auth.ts";

type DealCategory = "Electronics" | "Fashion" | "Food" | "Home" | "Beauty";
type DealRow = {
  id: string;
  title: string;
  description: string | null;
  category: DealCategory;
  price_bdt: number | null;
  image_url: string;
  stock: number;
  ends_at: string;
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
  const clientConfig: Record<string, unknown> = { hostname: host, port, username: user, password, db };
  if (tls) clientConfig.tls = tls;
  return await new Client().connect(clientConfig as any);
}

function normalizeDeal(r: DealRow) {
  return {
    id: String(r.id),
    title: String(r.title),
    description: r.description ?? "",
    category: r.category,
    priceBdt: typeof r.price_bdt === "number" ? r.price_bdt : r.price_bdt ? Number(r.price_bdt) : undefined,
    imageUrl: String(r.image_url),
    stock: Number(r.stock),
    endsAt: new Date(String(r.ends_at)).toISOString(),
    isActive: r.is_active === 1,
  };
}

function isCategory(v: string): v is DealCategory {
  return ["Electronics", "Fashion", "Food", "Home", "Beauty"].includes(v);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return json(admin.status, { error: admin.error });

    const client = await getMysqlClient();

    if (req.method === "GET") {
      const rows = (await client.query(
        `SELECT id, title, description, category, price_bdt, image_url, stock, ends_at, is_active
         FROM deals
         ORDER BY ends_at DESC
         LIMIT 200`,
      )) as DealRow[];
      await client.close();
      return json(200, { deals: rows.map(normalizeDeal) });
    }

    const body = (await req.json().catch(() => ({}))) as any;

    if (req.method === "POST") {
      const id = crypto.randomUUID();
      const title = String(body.title ?? "").trim();
      const description = String(body.description ?? "").trim();
      const category = String(body.category ?? "");
      const image_url = String(body.image_url ?? "").trim();
      const stock = Number(body.stock ?? 0);
      const is_active = Number(body.is_active ?? 1) ? 1 : 0;
      const ends_at = new Date(String(body.ends_at ?? ""));
      const price_bdt = body.price_bdt === null || body.price_bdt === undefined || body.price_bdt === "" ? null : Number(body.price_bdt);

      if (!title || title.length > 120) return json(400, { ok: false, error: "Invalid title" });
      if (!description || description.length > 500) return json(400, { ok: false, error: "Invalid description" });
      if (!isCategory(category)) return json(400, { ok: false, error: "Invalid category" });
      if (!Number.isFinite(stock) || stock < 0) return json(400, { ok: false, error: "Invalid stock" });
      if (Number.isFinite(price_bdt as any) && (price_bdt as number) < 0) return json(400, { ok: false, error: "Invalid price" });
      if (!(ends_at instanceof Date) || isNaN(ends_at.getTime())) return json(400, { ok: false, error: "Invalid ends_at" });
      if (!image_url || image_url.length > 500) return json(400, { ok: false, error: "Invalid image_url" });

      await client.execute(
        `INSERT INTO deals (id, title, description, category, price_bdt, image_url, stock, ends_at, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, description, category, price_bdt, image_url, stock, ends_at, is_active],
      );
      await client.close();
      return json(200, { ok: true, id });
    }

    if (req.method === "PUT") {
      const id = String(body.id ?? "");
      const title = String(body.title ?? "").trim();
      const description = String(body.description ?? "").trim();
      const category = String(body.category ?? "");
      const image_url = String(body.image_url ?? "").trim();
      const stock = Number(body.stock ?? 0);
      const ends_at = new Date(String(body.ends_at ?? ""));
      const price_bdt = body.price_bdt === null || body.price_bdt === undefined || body.price_bdt === "" ? null : Number(body.price_bdt);

      if (!id) return json(400, { ok: false, error: "Missing id" });
      if (!title || title.length > 120) return json(400, { ok: false, error: "Invalid title" });
      if (!description || description.length > 500) return json(400, { ok: false, error: "Invalid description" });
      if (!isCategory(category)) return json(400, { ok: false, error: "Invalid category" });
      if (!Number.isFinite(stock) || stock < 0) return json(400, { ok: false, error: "Invalid stock" });
      if (Number.isFinite(price_bdt as any) && (price_bdt as number) < 0) return json(400, { ok: false, error: "Invalid price" });
      if (!(ends_at instanceof Date) || isNaN(ends_at.getTime())) return json(400, { ok: false, error: "Invalid ends_at" });
      if (!image_url || image_url.length > 500) return json(400, { ok: false, error: "Invalid image_url" });

      await client.execute(
        `UPDATE deals
         SET title=?, description=?, category=?, price_bdt=?, image_url=?, stock=?, ends_at=?
         WHERE id=?`,
        [title, description, category, price_bdt, image_url, stock, ends_at, id],
      );
      await client.close();
      return json(200, { ok: true });
    }

    if (req.method === "PATCH") {
      const id = String(body.id ?? "");
      const is_active = Number(body.is_active ?? 0) ? 1 : 0;
      if (!id) return json(400, { ok: false, error: "Missing id" });
      await client.execute("UPDATE deals SET is_active=? WHERE id=?", [is_active, id]);
      await client.close();
      return json(200, { ok: true });
    }

    if (req.method === "DELETE") {
      const id = String(body.id ?? "");
      if (!id) return json(400, { ok: false, error: "Missing id" });
      await client.execute("DELETE FROM deals WHERE id=?", [id]);
      await client.close();
      return json(200, { ok: true });
    }

    await client.close();
    return json(405, { error: "Method not allowed" });
  } catch (err) {
    return json(500, { error: (err as Error).message });
  }
});
