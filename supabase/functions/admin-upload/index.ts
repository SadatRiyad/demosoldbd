import { corsHeaders, json, requireAdmin } from "../_util/auth.ts";

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function sslConfigFromMode(v: string | undefined) {
  const mode = (v ?? "PREFERRED").toUpperCase();
  if (mode === "DISABLED") return undefined;
  return {};
}

async function getMysqlClient() {
  const { Client } = await import("https://deno.land/x/mysql@v2.12.1/mod.ts");
  const host = requireEnv("HOSTINGER_MYSQL_HOST");
  const port = Number(requireEnv("HOSTINGER_MYSQL_PORT"));
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
  const seed = requireEnv("ADMIN_BOOTSTRAP_TOKEN");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
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

function extFromType(type: string) {
  const t = (type || "").toLowerCase();
  if (t === "image/jpeg") return "jpg";
  if (t === "image/png") return "png";
  if (t === "image/webp") return "webp";
  if (t === "image/gif") return "gif";
  return "bin";
}

function safeSlug(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function uploadToS3Like(args: {
  endpoint?: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  key: string;
  body: Uint8Array;
  contentType: string;
  publicBaseUrl?: string;
}) {
  const { AwsClient } = await import("https://deno.land/x/aws4fetch@0.6.4/mod.ts");

  const endpoint = (args.endpoint ?? "https://s3.amazonaws.com").replace(/\/$/, "");
  const url = `${endpoint}/${encodeURIComponent(args.bucket)}/${args.key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  const aws = new AwsClient({
    accessKeyId: args.accessKeyId,
    secretAccessKey: args.secretAccessKey,
    region: args.region ?? "auto",
    service: "s3",
  });

  const res = await aws.fetch(url, {
    method: "PUT",
    headers: {
      "content-type": args.contentType || "application/octet-stream",
      // Some providers (like R2) can reject `x-amz-acl` depending on settings.
      // Keeping it optional reduces incompatibilities.
    },
    body: args.body,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `S3/R2 upload failed (${res.status})`);
  }

  const base = args.publicBaseUrl?.replace(/\/$/, "") ?? (args.endpoint ? undefined : undefined);
  if (base) return `${base}/${args.key}`;
  // Fallback public URL (works for many S3-compatible providers when bucket is public)
  if (args.endpoint) {
    const ep = args.endpoint.replace(/\/$/, "");
    return `${ep}/${args.bucket}/${args.key}`;
  }
  return `https://${args.bucket}.s3.amazonaws.com/${args.key}`;
}

async function uploadToCloudinary(args: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
  publicId: string;
  file: Blob;
}) {
  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary signature: sha1 of sorted params + api_secret
  // We only sign folder/public_id/timestamp.
  const paramsToSign = [`folder=${args.folder ?? ""}`, `public_id=${args.publicId}`, `timestamp=${timestamp}`]
    .filter((s) => !s.endsWith("="))
    .join("&");
  const data = new TextEncoder().encode(paramsToSign + args.apiSecret);
  const digest = await crypto.subtle.digest("SHA-1", data);
  const signature = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const form = new FormData();
  form.set("file", args.file);
  if (args.folder) form.set("folder", args.folder);
  form.set("public_id", args.publicId);
  form.set("api_key", args.apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${args.cloudName}/auto/upload`, {
    method: "POST",
    body: form,
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out?.error?.message ?? "Cloudinary upload failed");
  return String(out.secure_url ?? out.url ?? "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return json(admin.status, { error: admin.error });
    if (req.method !== "POST") return json(405, { error: "Method not allowed" });

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return json(400, { ok: false, error: "Expected multipart/form-data" });
    }

    const form = await req.formData();
    const file = form.get("file");
    const purpose = String(form.get("purpose") ?? "asset");
    if (!(file instanceof File)) return json(400, { ok: false, error: "Missing file" });

    // Basic validation
    if (file.size <= 0) return json(400, { ok: false, error: "Empty file" });
    if (file.size > 8 * 1024 * 1024) return json(400, { ok: false, error: "Max 8MB" });

    const client = await getMysqlClient();
    await ensureTables(client);
    const rows = (await client.query(
      "SELECT provider, enc_json FROM external_storage_settings WHERE id=1 LIMIT 1",
    )) as Array<{ provider: string; enc_json: string }>;
    const provider = String(rows?.[0]?.provider ?? "");
    const settings = rows?.[0]?.enc_json ? await decryptJson(rows[0].enc_json) : {};
    await client.close();

    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = extFromType(file.type);
    const key = `${safeSlug(purpose)}/${crypto.randomUUID()}.${ext}`;

    let url = "";
    if (provider === "cloudinary") {
      const cloudName = String((settings as any).cloudName ?? "");
      const apiKey = String((settings as any).apiKey ?? "");
      const apiSecret = String((settings as any).apiSecret ?? "");
      const folder = String((settings as any).folder ?? "").trim() || undefined;
      if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary settings incomplete");
      url = await uploadToCloudinary({ cloudName, apiKey, apiSecret, folder, publicId: key.replace(/\.[^.]+$/, ""), file });
    } else if (provider === "s3" || provider === "r2") {
      const accessKeyId = String((settings as any).accessKeyId ?? "");
      const secretAccessKey = String((settings as any).secretAccessKey ?? "");
      const bucket = String((settings as any).bucket ?? "");
      const endpoint = String((settings as any).endpoint ?? "").trim() || undefined;
      const region = String((settings as any).region ?? "").trim() || undefined;
      const publicBaseUrl = String((settings as any).publicBaseUrl ?? "").trim() || undefined;
      if (!accessKeyId || !secretAccessKey || !bucket) throw new Error("S3/R2 settings incomplete");
      url = await uploadToS3Like({ endpoint, region, accessKeyId, secretAccessKey, bucket, key, body: bytes, contentType: file.type || "application/octet-stream", publicBaseUrl });
    } else {
      throw new Error("External storage not configured");
    }

    if (!url) throw new Error("Upload failed");
    return json(200, { ok: true, url, key });
  } catch (err) {
    return json(500, { ok: false, error: (err as Error).message });
  }
});
