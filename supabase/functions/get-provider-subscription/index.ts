import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-PROVIDER-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { provider_id, whatsapp } = await req.json();
    
    if (!provider_id && !whatsapp) {
      throw new Error("provider_id ou whatsapp é obrigatório");
    }

    let actualProviderId = provider_id;

    // Se temos whatsapp, buscar o provider_id
    if (whatsapp && !provider_id) {
      // Limpar o whatsapp para comparação
      const cleanPhone = whatsapp.replace(/\D/g, '');
      logStep("Searching provider by whatsapp", { cleanPhone });
      
      // Buscar por match parcial (últimos 8 dígitos)
      const last8 = cleanPhone.slice(-8);
      const { data: providers } = await supabaseClient
        .from('providers')
        .select('id, whatsapp')
        .ilike('whatsapp', `%${last8.slice(0,4)}%${last8.slice(4)}%`);

      logStep("Provider search result", { providers });

      const provider = providers?.[0];
      if (!provider) {
        return new Response(JSON.stringify({
          found: false,
          message: "Prestador não encontrado",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      actualProviderId = provider.id;
    }

    // Buscar subscription
    const { data: subscription, error } = await supabaseClient
      .from('provider_subscriptions')
      .select('*')
      .eq('provider_id', actualProviderId)
      .maybeSingle();

    if (error) throw error;

    // Buscar customization
    const { data: customization } = await supabaseClient
      .from('provider_customization')
      .select('*')
      .eq('provider_id', actualProviderId)
      .maybeSingle();

    // Buscar dados do provider
    const { data: provider } = await supabaseClient
      .from('providers')
      .select('*')
      .eq('id', actualProviderId)
      .maybeSingle();

    if (!subscription) {
      logStep("No subscription found, returning trial info");
      return new Response(JSON.stringify({
        found: true,
        provider,
        subscription: {
          plano: null,
          adesao_paga: false,
          trial_ativo: true,
          trial_corridas_restantes: 10,
          corridas_usadas: 0,
          limite_corridas: 0,
        },
        customization,
        needs_plan_selection: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const needsPlanSelection = !subscription.adesao_paga && 
      (subscription.trial_corridas_restantes <= 0 || !subscription.trial_ativo);

    logStep("Returning subscription data", { 
      plano: subscription.plano, 
      adesao_paga: subscription.adesao_paga,
      needs_plan_selection: needsPlanSelection 
    });

    return new Response(JSON.stringify({
      found: true,
      provider,
      subscription,
      customization,
      needs_plan_selection: needsPlanSelection,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
