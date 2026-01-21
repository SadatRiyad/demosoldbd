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
  const clientConfig: Record<string, unknown> = { hostname: host, port, username: user, password, db };
  if (tls) clientConfig.tls = tls;
  return await new Client().connect(clientConfig as any);
}

async function ensureTables(client: any) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS external_storage_settings (
      id INT NOT NULL PRIMARY KEY,
      provider VARCHAR(20) NOT NULL,
      enc_json TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
}

function b64encode(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function b64decode(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getEncKey() {
  // We intentionally derive the encryption key from an existing backend secret
  // so admins can configure providers entirely from the dashboard.
  const seed = requireEnv("ADMIN_BOOTSTRAP_TOKEN");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptJson(obj: unknown) {
  const key = await getEncKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(obj ?? {}));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext));
  return `${b64encode(iv)}.${b64encode(ciphertext)}`;
}

async function decryptJson(enc: string) {
  const key = await getEncKey();
  const [ivB64, ctB64] = String(enc ?? "").split(".");
  if (!ivB64 || !ctB64) return {};
  const iv = b64decode(ivB64);
  const ct = b64decode(ctB64);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  const txt = new TextDecoder().decode(new Uint8Array(plaintext));
  try {
    return JSON.parse(txt);
  } catch {
    return {};
  }
}

const ProviderSchema = ["s3", "r2", "cloudinary"] as const;
type Provider = (typeof ProviderSchema)[number];

function isProvider(v: string): v is Provider {
  return ProviderSchema.includes(v as Provider);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return json(admin.status, { error: admin.error });

    const client = await getMysqlClient();
    await ensureTables(client);

    // Ensure row exists
    await client.execute(
      `INSERT IGNORE INTO external_storage_settings (id, provider, enc_json)
       VALUES (1, 's3', '');`,
    );

    if (req.method === "GET") {
      const rows = (await client.query(
        "SELECT provider, enc_json FROM external_storage_settings WHERE id=1 LIMIT 1",
      )) as Array<{ provider: string; enc_json: string }>;
      const row = rows?.[0];
      const provider = (row?.provider ?? "s3") as string;
      const settings = row?.enc_json ? await decryptJson(row.enc_json) : {};
      await client.close();
      return json(200, { provider, settings });
    }

    if (req.method === "PUT") {
      const body = (await req.json().catch(() => ({}))) as any;
      const provider = String(body.provider ?? "");
      const settings = (body.settings ?? {}) as Record<string, unknown>;
      if (!isProvider(provider)) {
        await client.close();
        return json(400, { ok: false, error: "Invalid provider" });
      }
      const enc = await encryptJson(settings);
      await client.execute("UPDATE external_storage_settings SET provider=?, enc_json=? WHERE id=1", [provider, enc]);
      await client.close();
      return json(200, { ok: true });
    }

    await client.close();
    return json(405, { error: "Method not allowed" });
  } catch (err) {
    return json(500, { error: (err as Error).message });
  }
});
