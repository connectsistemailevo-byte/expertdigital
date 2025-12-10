import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuração dos planos
const PLANS = {
  basico: {
    adesao_price: "price_1SceWMBNYdvcVByojdMC6cQ0",
    mensalidade_price: "price_1SceWaBNYdvcVByoGDDOX1uP",
    limite_corridas: 50,
    mensalidade_valor: 47,
  },
  profissional: {
    adesao_price: "price_1SceWoBNYdvcVByohVLpAzdO",
    dominio_price: "price_1SceXIBNYdvcVByoCtx0qiMs",
    mensalidade_price: "price_1SceXTBNYdvcVByoPrryMK14",
    limite_corridas: 150,
    mensalidade_valor: 39,
  },
  pro: {
    adesao_price: "price_1SceXeBNYdvcVByoSsbks6c4",
    mensalidade_price: "price_1SceXqBNYdvcVByoDagHr7Sr",
    limite_corridas: -1, // Ilimitado
    mensalidade_valor: 19.90,
  },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PROVIDER-CHECKOUT] ${step}${detailsStr}`);
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

    const { provider_id, plano, whatsapp } = await req.json();
    
    if (!provider_id || !plano || !whatsapp) {
      throw new Error("provider_id, plano e whatsapp são obrigatórios");
    }

    if (!PLANS[plano as keyof typeof PLANS]) {
      throw new Error("Plano inválido");
    }

    logStep("Request data", { provider_id, plano, whatsapp });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Verificar se já existe um customer com esse whatsapp
    const customers = await stripe.customers.list({ 
      limit: 100 
    });
    
    let customer = customers.data.find((c: Stripe.Customer) => c.metadata?.whatsapp === whatsapp);
    
    if (!customer) {
      // Buscar dados do provider
      const { data: provider } = await supabaseClient
        .from('providers')
        .select('name')
        .eq('id', provider_id)
        .maybeSingle();

      customer = await stripe.customers.create({
        name: provider?.name || `Provider ${whatsapp}`,
        metadata: { 
          whatsapp,
          provider_id 
        },
      });
      logStep("Created new Stripe customer", { customerId: customer.id });
    } else {
      logStep("Found existing Stripe customer", { customerId: customer.id });
    }

    const planConfig = PLANS[plano as keyof typeof PLANS];
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Adicionar adesão
    lineItems.push({
      price: planConfig.adesao_price,
      quantity: 1,
    });

    // Adicionar taxa de domínio para plano profissional
    if (plano === 'profissional' && 'dominio_price' in planConfig) {
      lineItems.push({
        price: (planConfig as typeof PLANS.profissional).dominio_price,
        quantity: 1,
      });
    }

    // Adicionar mensalidade (subscription)
    lineItems.push({
      price: planConfig.mensalidade_price,
      quantity: 1,
    });

    const origin = req.headers.get("origin") || "https://showtime-guincho.lovable.app";

    // Criar sessão de checkout com modo misto (pagamento único + assinatura)
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${origin}/provider-dashboard?success=true&provider_id=${provider_id}`,
      cancel_url: `${origin}/?canceled=true`,
      metadata: {
        provider_id,
        plano,
        whatsapp,
      },
      subscription_data: {
        metadata: {
          provider_id,
          plano,
          whatsapp,
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
