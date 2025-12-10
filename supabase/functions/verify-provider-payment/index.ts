import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANS_CONFIG = {
  basico: { limite_corridas: 50, mensalidade_valor: 47 },
  profissional: { limite_corridas: 150, mensalidade_valor: 39 },
  pro: { limite_corridas: -1, mensalidade_valor: 19.90 },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PROVIDER-PAYMENT] ${step}${detailsStr}`);
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Buscar customer pelo whatsapp
    const customers = await stripe.customers.list({ limit: 100 });
    const customer = customers.data.find((c: Stripe.Customer) => 
      c.metadata?.whatsapp === whatsapp || c.metadata?.provider_id === provider_id
    );

    if (!customer) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        adesao_paga: false, 
        plano: null,
        subscription_active: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found customer", { customerId: customer.id });

    // Verificar assinaturas ativas
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription");
      return new Response(JSON.stringify({ 
        adesao_paga: false, 
        plano: null,
        subscription_active: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const plano = subscription.metadata?.plano as keyof typeof PLANS_CONFIG;
    const planConfig = PLANS_CONFIG[plano] || PLANS_CONFIG.basico;

    logStep("Active subscription found", { 
      subscriptionId: subscription.id, 
      plano,
      currentPeriodEnd: subscription.current_period_end 
    });

    // Atualizar subscription no banco
    const actualProviderId = provider_id || customer.metadata?.provider_id;
    
    if (actualProviderId) {
      const { error: upsertError } = await supabaseClient
        .from('provider_subscriptions')
        .upsert({
          provider_id: actualProviderId,
          plano,
          adesao_paga: true,
          adesao_paga_em: new Date().toISOString(),
          mensalidade_atual: planConfig.mensalidade_valor,
          limite_corridas: planConfig.limite_corridas,
          corridas_usadas: 0,
          trial_ativo: false,
          trial_corridas_restantes: 0,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          proxima_cobranca: new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: 'provider_id' });

      if (upsertError) {
        logStep("Error upserting subscription", { error: upsertError });
      } else {
        logStep("Subscription upserted successfully");
      }

      // Criar registro de pagamento
      await supabaseClient.from('provider_payments').insert({
        provider_id: actualProviderId,
        tipo: 'adesao',
        valor: plano === 'pro' ? 599 : plano === 'profissional' ? 249 : 149,
        status: 'pago',
      });
    }

    return new Response(JSON.stringify({
      adesao_paga: true,
      plano,
      subscription_active: true,
      limite_corridas: planConfig.limite_corridas,
      mensalidade_valor: planConfig.mensalidade_valor,
      proxima_cobranca: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_customer_id: customer.id,
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
