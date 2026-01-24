const bcrypt = require("bcryptjs");
const { asyncHandler } = require("../http");
const {
  signAccessToken,
  newRefreshToken,
  hashToken,
  verifyTokenHash,
  refreshExpiryDate,
} = require("../auth");

function mountAuthRoutes(app, { pool }) {
  // Login for admins (node-mode)
  app.post(
    "/api/auth/login",
    asyncHandler(async (req, res) => {
      const email = String(req.body?.email ?? "").trim().toLowerCase();
      const password = String(req.body?.password ?? "");
      if (!email || !password) return res.status(400).json({ error: "Missing email/password" });

      const [rows] = await pool.query("SELECT id, email, password_hash, role FROM admin_users WHERE email = ? LIMIT 1", [
        email,
      ]);
      const u = Array.isArray(rows) ? rows[0] : null;
      if (!u) return res.status(401).json({ error: "Invalid credentials" });
      const ok = await bcrypt.compare(password, String(u.password_hash));
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      const accessToken = signAccessToken({ sub: String(u.id), email: u.email, role: u.role });
      const refreshToken = newRefreshToken();
      const tokenHash = await hashToken(refreshToken);
      const expiresAt = refreshExpiryDate();
      await pool.query(
        "INSERT INTO auth_refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
        [Number(u.id), tokenHash, expiresAt],
      );
      res.json({ accessToken, refreshToken });
    }),
  );

  // Refresh token -> new access + rotated refresh
  app.post(
    "/api/auth/refresh",
    asyncHandler(async (req, res) => {
      const refreshToken = String(req.body?.refreshToken ?? "");
      if (!refreshToken) return res.status(400).json({ error: "Missing refreshToken" });

      const [rows] = await pool.query(
        "SELECT id, user_id, token_hash, expires_at FROM auth_refresh_tokens WHERE expires_at > NOW() ORDER BY id DESC LIMIT 200",
      );
      const list = Array.isArray(rows) ? rows : [];
      let match = null;
      for (const r of list) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await verifyTokenHash(refreshToken, String(r.token_hash));
        if (ok) {
          match = r;
          break;
        }
      }
      if (!match) return res.status(401).json({ error: "Invalid refresh token" });

      const [uRows] = await pool.query("SELECT id, email, role FROM admin_users WHERE id = ? LIMIT 1", [Number(match.user_id)]);
      const u = Array.isArray(uRows) ? uRows[0] : null;
      if (!u) return res.status(401).json({ error: "Invalid refresh token" });

      // Rotate refresh token
      const nextRefresh = newRefreshToken();
      const nextHash = await hashToken(nextRefresh);
      const expiresAt = refreshExpiryDate();
      await pool.query("DELETE FROM auth_refresh_tokens WHERE id = ?", [Number(match.id)]);
      await pool.query(
        "INSERT INTO auth_refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
        [Number(u.id), nextHash, expiresAt],
      );

      const accessToken = signAccessToken({ sub: String(u.id), email: u.email, role: u.role });
      res.json({ accessToken, refreshToken: nextRefresh });
    }),
  );
}

module.exports = {
  mountAuthRoutes,
};
