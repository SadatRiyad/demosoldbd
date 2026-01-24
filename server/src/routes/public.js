const { asyncHandler } = require("../http");

function mapDealRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    category: row.category,
    priceBdt: row.price_bdt == null ? undefined : Number(row.price_bdt),
    imageUrl: row.image_url || "",
    stock: Number(row.stock ?? 0),
    endsAt: new Date(row.ends_at).toISOString(),
  };
}

function mountPublicRoutes(app, { pool }) {
  app.get(
    "/api/health",
    asyncHandler(async (_req, res) => {
      res.json({ ok: true, backend: "node", ts: new Date().toISOString() });
    }),
  );

  app.get(
    "/api/deals",
    asyncHandler(async (_req, res) => {
      const [rows] = await pool.query(
        "SELECT id, title, description, category, price_bdt, image_url, stock, ends_at FROM deals WHERE is_active = 1 AND ends_at > NOW() ORDER BY ends_at ASC LIMIT 200",
      );
      res.json({ deals: Array.isArray(rows) ? rows.map(mapDealRow) : [] });
    }),
  );

  app.get(
    "/api/site-settings",
    asyncHandler(async (_req, res) => {
      const [rows] = await pool.query(
        "SELECT id, brand_name, brand_tagline, header_kicker, hero_h1, hero_subtitle, whatsapp_phone_e164, whatsapp_default_message, next_drop_at, content_json FROM site_settings WHERE id = 1 LIMIT 1",
      );
      const r = Array.isArray(rows) ? rows[0] : null;
      if (!r) return res.json({ settings: null });
      let content = {};
      try {
        content = r.content_json ? JSON.parse(String(r.content_json)) : {};
      } catch {
        content = {};
      }
      res.json({
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
          content,
        },
      });
    }),
  );

  app.post(
    "/api/early-access",
    asyncHandler(async (req, res) => {
      const email = String(req.body?.email ?? "").trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return res.json({ ok: false, error: "Invalid email" });
      await pool.query("INSERT IGNORE INTO early_access_signups (email) VALUES (?)", [email]);
      res.json({ ok: true });
    }),
  );
}

module.exports = {
  mountPublicRoutes,
};
