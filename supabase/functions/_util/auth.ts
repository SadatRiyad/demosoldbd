// NOTE: Edge Functions should not import from src/. This helper is local to functions.
// It is used by multiple backend functions.

import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const userId = data.claims.sub;
  return { ok: true as const, userId, authHeader, supabase };
}

export async function requireAdmin(req: Request) {
  const u = await requireUser(req);
  if (!u.ok) return u;

  const { data, error } = await u.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", u.userId)
    .eq("role", "admin")
    .limit(1);

  if (error) return { ok: false as const, status: 500, error: error.message };
  if (!data?.length) return { ok: false as const, status: 403, error: "Forbidden" };

  return u;
}

export function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, "content-type": "application/json" },
  });
}
