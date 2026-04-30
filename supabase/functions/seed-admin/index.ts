import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "admin@cpmk.local";
const ADMIN_PASSWORD = "Admin123!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if admin already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    let adminUser = existing?.users.find((u) => u.email === ADMIN_EMAIL);

    if (!adminUser) {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Administrator" },
      });
      if (createErr) throw createErr;
      adminUser = created.user!;
    }

    // Ensure admin role
    await supabase.from("user_roles").delete().eq("user_id", adminUser.id);
    const { error: roleErr } = await supabase
      .from("user_roles")
      .insert({ user_id: adminUser.id, role: "admin" });
    if (roleErr) throw roleErr;

    // Ensure profile
    await supabase
      .from("profiles")
      .upsert({ id: adminUser.id, full_name: "Administrator" });

    return new Response(
      JSON.stringify({
        success: true,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        message: "Admin account ready",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
