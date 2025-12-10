import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[INCREMENT-PROVIDER-RIDES] ${step}${detailsStr}`);
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

    const { provider_id } = await req.json();
    
    if (!provider_id) {
      throw new Error("provider_id é obrigatório");
    }

    // Buscar subscription atual
    const { data: subscription, error: fetchError } = await supabaseClient
      .from('provider_subscriptions')
      .select('*')
      .eq('provider_id', provider_id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!subscription) {
      // Verificar se tem trial
      const { data: provider } = await supabaseClient
        .from('providers')
        .select('id')
        .eq('id', provider_id)
        .maybeSingle();

      if (!provider) {
        throw new Error("Prestador não encontrado");
      }

      // Criar subscription com trial
      const { data: newSub, error: insertError } = await supabaseClient
        .from('provider_subscriptions')
        .insert({
          provider_id,
          trial_ativo: true,
          trial_corridas_restantes: 10,
          corridas_usadas: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      logStep("Created trial subscription", { provider_id });

      return new Response(JSON.stringify({
        success: true,
        trial_ativo: true,
        trial_corridas_restantes: 10,
        blocked: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verificar se está em trial
    if (subscription.trial_ativo && !subscription.adesao_paga) {
      if (subscription.trial_corridas_restantes <= 0) {
        logStep("Trial exhausted", { provider_id });
        return new Response(JSON.stringify({
          success: false,
          blocked: true,
          reason: "trial_exhausted",
          message: "Suas corridas de teste acabaram. Escolha um plano para continuar.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Decrementar trial
      const { error: updateError } = await supabaseClient
        .from('provider_subscriptions')
        .update({
          trial_corridas_restantes: subscription.trial_corridas_restantes - 1,
          corridas_usadas: subscription.corridas_usadas + 1,
        })
        .eq('provider_id', provider_id);

      if (updateError) throw updateError;

      logStep("Decremented trial ride", { 
        remaining: subscription.trial_corridas_restantes - 1 
      });

      return new Response(JSON.stringify({
        success: true,
        trial_ativo: true,
        trial_corridas_restantes: subscription.trial_corridas_restantes - 1,
        blocked: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verificar plano pago
    if (!subscription.adesao_paga) {
      return new Response(JSON.stringify({
        success: false,
        blocked: true,
        reason: "no_plan",
        message: "Você precisa escolher um plano para continuar.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Plano PRO = ilimitado
    if (subscription.plano === 'pro') {
      const { error: updateError } = await supabaseClient
        .from('provider_subscriptions')
        .update({
          corridas_usadas: subscription.corridas_usadas + 1,
        })
        .eq('provider_id', provider_id);

      if (updateError) throw updateError;

      logStep("Incremented PRO ride (unlimited)", { provider_id });

      return new Response(JSON.stringify({
        success: true,
        plano: 'pro',
        corridas_usadas: subscription.corridas_usadas + 1,
        limite_corridas: -1,
        blocked: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verificar limite de corridas para planos básico e profissional
    if (subscription.corridas_usadas >= subscription.limite_corridas) {
      logStep("Ride limit reached", { 
        provider_id, 
        used: subscription.corridas_usadas, 
        limit: subscription.limite_corridas 
      });

      return new Response(JSON.stringify({
        success: false,
        blocked: true,
        reason: "limit_reached",
        message: `Você atingiu o limite de ${subscription.limite_corridas} corridas do seu plano.`,
        corridas_usadas: subscription.corridas_usadas,
        limite_corridas: subscription.limite_corridas,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Incrementar corrida
    const { error: updateError } = await supabaseClient
      .from('provider_subscriptions')
      .update({
        corridas_usadas: subscription.corridas_usadas + 1,
      })
      .eq('provider_id', provider_id);

    if (updateError) throw updateError;

    logStep("Incremented ride", { 
      provider_id, 
      used: subscription.corridas_usadas + 1, 
      limit: subscription.limite_corridas 
    });

    return new Response(JSON.stringify({
      success: true,
      plano: subscription.plano,
      corridas_usadas: subscription.corridas_usadas + 1,
      limite_corridas: subscription.limite_corridas,
      blocked: false,
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
