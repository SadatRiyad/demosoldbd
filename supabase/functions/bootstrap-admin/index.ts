import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json, requireUser } from "../_util/auth.ts";

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const u = await requireUser(req);
    if (!u.ok) return json(u.status, { error: u.error });
    if (req.method !== "POST") return json(405, { error: "Method not allowed" });

    const body = (await req.json().catch(() => ({}))) as { token?: string };
    const provided = String(body.token ?? "").trim();
    const expected = requireEnv("ADMIN_BOOTSTRAP_TOKEN");
    if (!provided || provided !== expected) return json(403, { ok: false, error: "Invalid token" });

    // Check if any admin already exists
    const service = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
    const { data: existing, error: existingErr } = await service
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .limit(1);
    if (existingErr) return json(500, { ok: false, error: existingErr.message });
    if (existing?.length) return json(409, { ok: false, error: "An admin already exists" });

    const { error: insertErr } = await service.from("user_roles").insert({ user_id: u.userId, role: "admin" });
    if (insertErr) return json(500, { ok: false, error: insertErr.message });

    return json(200, { ok: true });
  } catch (err) {
    return json(500, { ok: false, error: (err as Error).message });
  }
});
