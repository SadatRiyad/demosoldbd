const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { requireEnv } = require("./env");

const ACCESS_TTL_SECONDS = 60 * 15; // 15 min
const REFRESH_TTL_DAYS = 30;

function signAccessToken(payload) {
  const secret = requireEnv("JWT_SECRET");
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TTL_SECONDS });
}

function verifyAccessToken(token) {
  const secret = requireEnv("JWT_SECRET");
  return jwt.verify(token, secret);
}

function newRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

async function hashToken(token) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(token, salt);
}

async function verifyTokenHash(token, hash) {
  return bcrypt.compare(token, hash);
}

function refreshExpiryDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + REFRESH_TTL_DAYS);
  return d;
}

function requireAdminAuth(req, res) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const token = h.slice("Bearer ".length);
  try {
    const claims = verifyAccessToken(token);
    if (!claims || claims.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return null;
    }
    return claims;
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}

module.exports = {
  ACCESS_TTL_SECONDS,
  signAccessToken,
  verifyAccessToken,
  newRefreshToken,
  hashToken,
  verifyTokenHash,
  refreshExpiryDate,
  requireAdminAuth,
};
