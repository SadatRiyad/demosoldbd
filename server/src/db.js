const mysql = require("mysql2/promise");
const { requireEnv, envInt } = require("./env");

function sslConfigFromMode(v) {
  const mode = String(v ?? "PREFERRED").toUpperCase();
  if (mode === "DISABLED") return undefined;
  // mysql2 accepts either boolean/object. We keep it permissive.
  return {};
}

function getPool() {
  const host = requireEnv("HOSTINGER_MYSQL_HOST");
  const port = envInt("HOSTINGER_MYSQL_PORT", 3306);
  const user = requireEnv("HOSTINGER_MYSQL_USER");
  const password = requireEnv("HOSTINGER_MYSQL_PASSWORD");
  const database = requireEnv("HOSTINGER_MYSQL_DATABASE");
  const tls = sslConfigFromMode(process.env.HOSTINGER_MYSQL_SSLMODE);

  const cfg = {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
  if (tls) cfg.ssl = tls;
  return mysql.createPool(cfg);
}

async function ensureTables(pool) {
  // Deals
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deals (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      title VARCHAR(140) NOT NULL,
      description VARCHAR(600) NOT NULL,
      category VARCHAR(60) NOT NULL,
      price_bdt INT NULL,
      image_url VARCHAR(600) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      ends_at DATETIME NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // Site settings (single row id=1)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INT NOT NULL PRIMARY KEY,
      brand_name VARCHAR(60) NOT NULL,
      brand_tagline VARCHAR(120) NOT NULL,
      header_kicker VARCHAR(80) NOT NULL,
      hero_h1 VARCHAR(200) NOT NULL,
      hero_subtitle VARCHAR(240) NOT NULL,
      whatsapp_phone_e164 VARCHAR(32) NOT NULL,
      whatsapp_default_message VARCHAR(500) NOT NULL,
      next_drop_at DATETIME NULL,
      content_json TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // Early access
  await pool.query(`
    CREATE TABLE IF NOT EXISTS early_access_signups (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Admin users (for node-mode auth)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Refresh tokens
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_auth_refresh_user (user_id),
      INDEX idx_auth_refresh_expires (expires_at)
    );
  `);

  // External storage settings (single row id=1)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS external_storage_settings (
      id INT NOT NULL PRIMARY KEY,
      provider VARCHAR(32) NULL,
      settings_json TEXT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // Ensure singleton rows
  await pool.query(
    `INSERT IGNORE INTO site_settings (id, brand_name, brand_tagline, header_kicker, hero_h1, hero_subtitle, whatsapp_phone_e164, whatsapp_default_message, next_drop_at, content_json)
     VALUES (1, 'sold.bd', 'Bangladesh\'s Flash Deals Marketplace', 'Live drops • Limited stock',
             'Get it Before it\'s Sold — Bangladesh\'s Flash Deals Marketplace',
             'Limited-stock drops from local sellers. Miss it, it\'s gone forever.',
             '+8801700000000',
             'Hi sold.bd! I want early access and updates about upcoming flash drops.',
             NULL,
             '{}')`,
  );

  await pool.query(`INSERT IGNORE INTO external_storage_settings (id, provider, settings_json) VALUES (1, NULL, NULL)`);
}

module.exports = {
  getPool,
  ensureTables,
};
