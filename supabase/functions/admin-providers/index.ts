import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-PROVIDERS] ${step}${detailsStr}`);
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

    const body = await req.json();
    const { action, provider_id, data, admin_password } = body;
    
    logStep("Request received", { action, hasPassword: !!admin_password });

    // Verificar senha de admin (simples por enquanto)
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    logStep("Password check", { envPasswordSet: !!ADMIN_PASSWORD, passwordMatch: admin_password === ADMIN_PASSWORD });
    
    if (!ADMIN_PASSWORD) {
      logStep("ADMIN_PASSWORD env not set, using fallback");
    }
    
    const validPassword = ADMIN_PASSWORD || "guincho2024admin";
    if (admin_password !== validPassword) {
      logStep("Password mismatch", { received: admin_password?.substring(0, 3) + '***' });
      return new Response(JSON.stringify({ error: "Acesso não autorizado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    logStep("Password validated successfully");

    logStep("Action requested", { action, provider_id });

    switch (action) {
      case "list_providers": {
        // Listar todos os providers com suas subscriptions
        const { data: providers, error } = await supabaseClient
          .from('providers')
          .select(`
            *,
            provider_subscriptions (*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        logStep("Listed providers", { count: providers?.length });

        return new Response(JSON.stringify({ providers }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "toggle_trial": {
        if (!provider_id) throw new Error("provider_id é obrigatório");

        const { data: existingSub } = await supabaseClient
          .from('provider_subscriptions')
          .select('*')
          .eq('provider_id', provider_id)
          .maybeSingle();

        if (existingSub) {
          // Toggle trial
          const newTrialStatus = !existingSub.trial_ativo;
          const { error } = await supabaseClient
            .from('provider_subscriptions')
            .update({
              trial_ativo: newTrialStatus,
              trial_corridas_restantes: newTrialStatus ? 10 : 0,
            })
            .eq('provider_id', provider_id);

          if (error) throw error;
          logStep("Toggled trial", { provider_id, newTrialStatus });
        } else {
          // Criar subscription com trial
          const { error } = await supabaseClient
            .from('provider_subscriptions')
            .insert({
              provider_id,
              trial_ativo: true,
              trial_corridas_restantes: 10,
              corridas_usadas: 0,
            });

          if (error) throw error;
          logStep("Created trial subscription", { provider_id });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "set_trial_rides": {
        if (!provider_id || data?.rides === undefined) {
          throw new Error("provider_id e rides são obrigatórios");
        }

        const ridesValue = parseInt(data.rides, 10);
        logStep("Setting trial rides", { provider_id, ridesValue, rawValue: data.rides });

        // Primeiro verifica se já existe subscription
        const { data: existingSub, error: fetchError } = await supabaseClient
          .from('provider_subscriptions')
          .select('*')
          .eq('provider_id', provider_id)
          .maybeSingle();

        if (fetchError) {
          logStep("Error fetching subscription", { error: fetchError.message });
          throw fetchError;
        }

        if (existingSub) {
          // Atualiza apenas os campos de trial, mantendo os outros
          const { data: updatedSub, error: updateError } = await supabaseClient
            .from('provider_subscriptions')
            .update({
              trial_ativo: true,
              trial_corridas_restantes: ridesValue,
              updated_at: new Date().toISOString(),
            })
            .eq('provider_id', provider_id)
            .select()
            .single();

          if (updateError) {
            logStep("Error updating subscription", { error: updateError.message });
            throw updateError;
          }
          
          logStep("Updated trial rides", { provider_id, newValue: updatedSub?.trial_corridas_restantes });
        } else {
          // Cria nova subscription com trial
          const { data: newSub, error: insertError } = await supabaseClient
            .from('provider_subscriptions')
            .insert({
              provider_id,
              trial_ativo: true,
              trial_corridas_restantes: ridesValue,
              corridas_usadas: 0,
              adesao_paga: false,
              limite_corridas: 0,
              mensalidade_atual: 0,
            })
            .select()
            .single();

          if (insertError) {
            logStep("Error inserting subscription", { error: insertError.message });
            throw insertError;
          }
          
          logStep("Created trial subscription", { provider_id, newValue: newSub?.trial_corridas_restantes });
        }

        logStep("Set trial rides completed", { provider_id, rides: ridesValue });

        return new Response(JSON.stringify({ success: true, rides: ridesValue }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "activate_plan": {
        if (!provider_id || !data?.plano) {
          throw new Error("provider_id e plano são obrigatórios");
        }

        const planLimits = {
          basico: { limite: 50, mensalidade: 47 },
          profissional: { limite: 150, mensalidade: 39 },
          pro: { limite: -1, mensalidade: 19.90 },
        };

        const config = planLimits[data.plano as keyof typeof planLimits];
        if (!config) throw new Error("Plano inválido");

        const { error } = await supabaseClient
          .from('provider_subscriptions')
          .upsert({
            provider_id,
            plano: data.plano,
            adesao_paga: true,
            adesao_paga_em: new Date().toISOString(),
            trial_ativo: false,
            trial_corridas_restantes: 0,
            corridas_usadas: 0,
            limite_corridas: config.limite,
            mensalidade_atual: config.mensalidade,
            proxima_cobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: 'provider_id' });

        if (error) throw error;
        logStep("Activated plan", { provider_id, plano: data.plano });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "reset_rides": {
        if (!provider_id) throw new Error("provider_id é obrigatório");

        const { error } = await supabaseClient
          .from('provider_subscriptions')
          .update({ corridas_usadas: 0 })
          .eq('provider_id', provider_id);

        if (error) throw error;
        logStep("Reset rides", { provider_id });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "deactivate_plan": {
        if (!provider_id) throw new Error("provider_id é obrigatório");

        const { error } = await supabaseClient
          .from('provider_subscriptions')
          .update({
            plano: null,
            adesao_paga: false,
            trial_ativo: false,
            trial_corridas_restantes: 0,
            limite_corridas: 0,
            mensalidade_atual: 0,
          })
          .eq('provider_id', provider_id);

        if (error) throw error;
        logStep("Deactivated plan", { provider_id });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
