import { createClient } from "npm:@supabase/supabase-js@2.110.5";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";
const headers = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Vary": "Origin"
};

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  if (!allowedOrigin || origin !== allowedOrigin) return json({ error: "Forbidden" }, 403);
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { pin } = await request.json();
    if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) return json({ error: "Invalid PIN" }, 401);

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = request.headers.get("cf-connecting-ip") ?? forwardedFor ?? "unknown";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: userId, error: pinError } = await admin.rpc("verify_super_tasks_pin", {
      p_pin: pin,
      p_ip: ip
    });
    if (pinError) return json({ error: "Login unavailable" }, 503);
    if (!userId) return json({ error: "Invalid PIN" }, 401);

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (userError || !email) return json({ error: "Login unavailable" }, 503);

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email
    });
    const tokenHash = linkData.properties?.hashed_token;
    if (linkError || !tokenHash) return json({ error: "Login unavailable" }, 503);

    return json({ token_hash: tokenHash }, 200);
  } catch (_) {
    return json({ error: "Invalid request" }, 400);
  }
});
