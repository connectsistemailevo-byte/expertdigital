import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { provider_id, user_agent, referrer } = await req.json();

    if (!provider_id) {
      return new Response(
        JSON.stringify({ error: "provider_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Registrar o escaneamento
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const ipHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(ip + provider_id)
    ).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16));

    const { error: scanError } = await supabase
      .from("qr_code_scans")
      .insert({
        provider_id,
        user_agent: user_agent?.substring(0, 500) || null,
        ip_hash: ipHash,
        referrer: referrer?.substring(0, 500) || null,
      });

    if (scanError) {
      console.error("Error inserting scan:", scanError);
    }

    // Buscar dados do prestador para notificação
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("name, whatsapp")
      .eq("id", provider_id)
      .single();

    if (providerError || !provider) {
      console.error("Provider not found:", providerError);
      return new Response(
        JSON.stringify({ success: true, notification_sent: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Contar escaneamentos do dia para o prestador
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayScans } = await supabase
      .from("qr_code_scans")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", provider_id)
      .gte("scanned_at", today.toISOString());

    // Buscar subscription para ver se tem push habilitado
    const { data: subscription } = await supabase
      .from("provider_subscriptions")
      .select("push_token, push_enabled")
      .eq("provider_id", provider_id)
      .single();

    // Se tiver push token e estiver habilitado, enviar notificação
    // Por enquanto, vamos apenas registrar que a notificação seria enviada
    // A implementação real do push seria com web-push ou Firebase
    
    console.log(`QR Scan registered for provider ${provider.name}. Today's scans: ${todayScans}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scans_today: todayScans,
        notification_sent: false, // Será true quando implementar web-push
        message: `Escaneamento registrado para ${provider.name}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error in notify-qr-scan:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
