const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const multer = require("multer");

const { getPool, ensureTables } = require("./db");
const { mountPublicRoutes } = require("./routes/public");
const { mountAuthRoutes } = require("./routes/auth");
const { mountAdminRoutes } = require("./routes/admin");

async function createApp() {
  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN || "*";
  app.use(
    cors({
      origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((s) => s.trim()).filter(Boolean),
      credentials: false,
    }),
  );

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  const pool = getPool();
  await ensureTables(pool);

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  mountPublicRoutes(app, { pool });
  mountAuthRoutes(app, { pool });
  mountAdminRoutes(app, { pool, upload });

  // 404
  app.use((req, res) => res.status(404).json({ error: "Not found" }));

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    // Avoid leaking internals
    const msg = err instanceof Error ? err.message : "Server error";
    res.status(500).json({ error: msg });
  });

  return app;
}

module.exports = {
  createApp,
};
