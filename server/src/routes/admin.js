const { asyncHandler } = require("../http");
const { requireAdminAuth } = require("../auth");
const { requireEnv } = require("../env");
const bcrypt = require("bcryptjs");

function safeJsonParse(v) {
  try {
    return v ? JSON.parse(String(v)) : {};
  } catch {
    return {};
  }
}

function mountAdminRoutes(app, { pool, upload }) {
  // Bootstrap first admin user
  app.post(
    "/api/bootstrap-admin",
    asyncHandler(async (req, res) => {
      const token = String(req.body?.token ?? "").trim();
      const email = String(req.body?.email ?? "").trim().toLowerCase();
      const password = String(req.body?.password ?? "");
      if (!token) return res.status(400).json({ ok: false, error: "Missing token" });
      if (token !== requireEnv("ADMIN_BOOTSTRAP_TOKEN")) return res.status(403).json({ ok: false, error: "Invalid token" });
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ ok: false, error: "Invalid email" });
      if (!password || password.length < 8) return res.status(400).json({ ok: false, error: "Password must be 8+ chars" });

      const [existing] = await pool.query("SELECT id FROM admin_users LIMIT 1");
      if (Array.isArray(existing) && existing.length) {
        return res.status(409).json({ ok: false, error: "Admin already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query("INSERT INTO admin_users (email, password_hash, role) VALUES (?, ?, 'admin')", [email, passwordHash]);
      return res.json({ ok: true });
    }),
  );

  app.get(
    "/api/admin-mysql-status",
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;

      const checks = [
        { key: "HOSTINGER_MYSQL_HOST", label: "Host", ok: !!process.env.HOSTINGER_MYSQL_HOST },
        { key: "HOSTINGER_MYSQL_PORT", label: "Port", ok: !!process.env.HOSTINGER_MYSQL_PORT },
        { key: "HOSTINGER_MYSQL_USER", label: "User", ok: !!process.env.HOSTINGER_MYSQL_USER },
        { key: "HOSTINGER_MYSQL_PASSWORD", label: "Password", ok: !!process.env.HOSTINGER_MYSQL_PASSWORD },
        { key: "HOSTINGER_MYSQL_DATABASE", label: "Database", ok: !!process.env.HOSTINGER_MYSQL_DATABASE },
      ].map((c) => ({ ...c, message: c.ok ? undefined : "Missing" }));

      res.json({ ok: true, checks });
    }),
  );

  // Admin deals CRUD
  app.get(
    "/api/admin-deals",
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;
      const [rows] = await pool.query(
        "SELECT id, title, description, category, price_bdt, image_url, stock, ends_at, is_active FROM deals ORDER BY ends_at DESC LIMIT 500",
      );
      const deals = (Array.isArray(rows) ? rows : []).map((r) => ({
        id: String(r.id),
        title: r.title,
        description: r.description,
        category: r.category,
        priceBdt: r.price_bdt == null ? undefined : Number(r.price_bdt),
        imageUrl: r.image_url || "",
        stock: Number(r.stock ?? 0),
        endsAt: new Date(r.ends_at).toISOString(),
        isActive: Number(r.is_active) === 1,
      }));
      res.json({ deals });
    }),
  );

  app.post(
    "/api/admin-deals",
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;
      const b = req.body ?? {};
      const id = String(b.id ?? cryptoRandomId());
      await pool.query(
        "INSERT INTO deals (id, title, description, category, price_bdt, image_url, stock, ends_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id,
          String(b.title ?? ""),
          String(b.description ?? ""),
          String(b.category ?? ""),
          b.price_bdt == null ? null : Number(b.price_bdt),
          String(b.image_url ?? ""),
          Number(b.stock ?? 0),
          new Date(String(b.ends_at ?? new Date().toISOString())),
          Number(b.is_active ?? 1) ? 1 : 0,
        ],
      );
      res.json({ ok: true });
    }),
  );

  app.put(
    "/api/admin-deals",
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;
      const b = req.body ?? {};
      const id = String(b.id ?? "");
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });
      await pool.query(
        "UPDATE deals SET title=?, description=?, category=?, price_bdt=?, image_url=?, stock=?, ends_at=? WHERE id=?",
        [
          String(b.title ?? ""),
          String(b.description ?? ""),
          String(b.category ?? ""),
          b.price_bdt == null ? null : Number(b.price_bdt),
          String(b.image_url ?? ""),
          Number(b.stock ?? 0),
          new Date(String(b.ends_at ?? new Date().toISOString())),
          id,
        ],
      );
      res.json({ ok: true });
    }),
  );

  app.patch(
    "/api/admin-deals",
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;
      const b = req.body ?? {};
      const id = String(b.id ?? "");
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });
      const active = Number(b.is_active ?? 0) ? 1 : 0;
      await pool.query("UPDATE deals SET is_active=? WHERE id=?", [active, id]);
      res.json({ ok: true });
    }),
  );

  app.delete(
    "/api/admin-deals",
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;
      const id = String(req.body?.id ?? "");
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });
      await pool.query("DELETE FROM deals WHERE id=?", [id]);
      res.json({ ok: true });
    }),
  );

  // Admin site settings
  app.put(
    "/api/admin-site-settings",
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;
      const b = req.body ?? {};
      await pool.query(
        "UPDATE site_settings SET brand_name=?, brand_tagline=?, header_kicker=?, hero_h1=?, hero_subtitle=?, whatsapp_phone_e164=?, whatsapp_default_message=?, next_drop_at=? WHERE id=1",
        [
          String(b.brand_name ?? ""),
          String(b.brand_tagline ?? ""),
          String(b.header_kicker ?? ""),
          String(b.hero_h1 ?? ""),
          String(b.hero_subtitle ?? ""),
          String(b.whatsapp_phone_e164 ?? ""),
          String(b.whatsapp_default_message ?? ""),
          b.next_drop_at ? new Date(String(b.next_drop_at)) : null,
        ],
      );
      res.json({ ok: true });
    }),
  );

  app.patch(
    "/api/admin-site-settings",
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;
      const patch = (req.body?.content_patch ?? {}) || {};
      const [rows] = await pool.query("SELECT content_json FROM site_settings WHERE id=1 LIMIT 1");
      const r = Array.isArray(rows) ? rows[0] : null;
      const cur = safeJsonParse(r?.content_json);
      const next = { ...cur, ...patch };
      await pool.query("UPDATE site_settings SET content_json=? WHERE id=1", [JSON.stringify(next)]);
      res.json({ ok: true });
    }),
  );

  // Admin early access list
  app.get(
    "/api/admin-early-access",
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;
      const [rows] = await pool.query(
        "SELECT id, email, created_at FROM early_access_signups ORDER BY created_at DESC LIMIT 200",
      );
      const signups = (Array.isArray(rows) ? rows : []).map((r) => ({
        id: String(r.id),
        email: r.email,
        created_at: new Date(String(r.created_at)).toISOString(),
      }));
      res.json({ signups });
    }),
  );

  // External storage settings
  app.get(
    "/api/admin-storage-settings",
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;
      const [rows] = await pool.query("SELECT provider, settings_json FROM external_storage_settings WHERE id=1 LIMIT 1");
      const r = Array.isArray(rows) ? rows[0] : null;
      const provider = r?.provider ?? null;
      const settings = safeJsonParse(r?.settings_json);
      res.json({ provider, settings });
    }),
  );

  app.put(
    "/api/admin-storage-settings",
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;
      const provider = String(req.body?.provider ?? "");
      const settings = req.body?.settings ?? {};
      if (!provider) return res.status(400).json({ ok: false, error: "Missing provider" });
      await pool.query("UPDATE external_storage_settings SET provider=?, settings_json=? WHERE id=1", [
        provider,
        JSON.stringify(settings),
      ]);
      res.json({ ok: true });
    }),
  );

  // Upload
  app.post(
    "/api/admin-upload",
    upload.single("file"),
    asyncHandler(async (req, res) => {
      const auth = requireAdminAuth(req, res);
      if (!auth) return;

      // Minimal: return a clear error until you wire S3/R2/Cloudinary.
      // (Frontend already supports pasting hosted URLs, so this keeps prod stable.)
      res.status(501).json({ ok: false, error: "Upload not configured on Node server yet. Use hosted image URLs." });
    }),
  );
}

function cryptoRandomId() {
  // Short collision-resistant id without extra deps.
  return `d_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

module.exports = {
  mountAdminRoutes,
};
