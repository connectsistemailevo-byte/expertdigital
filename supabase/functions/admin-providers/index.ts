import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const body = await req.json();
    const { action, provider_id, data, admin_password } = body;

    // Verificar senha de admin
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "guincho2024admin";
    if (admin_password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Acesso não autorizado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    switch (action) {
      case "list_providers": {
        // Buscar providers
        const { data: providers, error: provError } = await supabaseClient
          .from('providers')
          .select('id, name, whatsapp, slug, address, region, created_at')
          .order('created_at', { ascending: false });

        if (provError) throw provError;

        // Buscar subscriptions separadamente
        const { data: subscriptions, error: subError } = await supabaseClient
          .from('provider_subscriptions')
          .select('*');

        if (subError) throw subError;

        // Combinar manualmente
        const result = providers?.map(provider => {
          const sub = subscriptions?.find(s => s.provider_id === provider.id);
          return {
            ...provider,
            provider_subscriptions: sub ? [{
              id: sub.id,
              plano: sub.plano,
              adesao_paga: sub.adesao_paga,
              trial_ativo: sub.trial_ativo,
              trial_corridas_restantes: sub.trial_corridas_restantes,
              corridas_usadas: sub.corridas_usadas,
              limite_corridas: sub.limite_corridas,
              mensalidade_atual: sub.mensalidade_atual,
            }] : []
          };
        });

        console.log("Returning providers:", JSON.stringify(result));

        return new Response(JSON.stringify({ providers: result }), {
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
          const newTrialStatus = !existingSub.trial_ativo;
          await supabaseClient
            .from('provider_subscriptions')
            .update({
              trial_ativo: newTrialStatus,
              trial_corridas_restantes: newTrialStatus ? 10 : 0,
            })
            .eq('provider_id', provider_id);
        } else {
          await supabaseClient
            .from('provider_subscriptions')
            .insert({
              provider_id,
              trial_ativo: true,
              trial_corridas_restantes: 10,
              corridas_usadas: 0,
            });
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

        const { data: existingSub } = await supabaseClient
          .from('provider_subscriptions')
          .select('*')
          .eq('provider_id', provider_id)
          .maybeSingle();

        if (existingSub) {
          await supabaseClient
            .from('provider_subscriptions')
            .update({
              trial_ativo: true,
              trial_corridas_restantes: ridesValue,
            })
            .eq('provider_id', provider_id);
        } else {
          await supabaseClient
            .from('provider_subscriptions')
            .insert({
              provider_id,
              trial_ativo: true,
              trial_corridas_restantes: ridesValue,
              corridas_usadas: 0,
            });
        }

        return new Response(JSON.stringify({ success: true, rides: ridesValue }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "activate_plan": {
        if (!provider_id || !data?.plano) {
          throw new Error("provider_id e plano são obrigatórios");
        }

        const planLimits: Record<string, { limite: number; mensalidade: number }> = {
          basico: { limite: 50, mensalidade: 47 },
          profissional: { limite: 150, mensalidade: 39 },
          pro: { limite: -1, mensalidade: 19.90 },
        };

        const config = planLimits[data.plano];
        if (!config) throw new Error("Plano inválido");

        await supabaseClient
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

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "reset_rides": {
        if (!provider_id) throw new Error("provider_id é obrigatório");

        await supabaseClient
          .from('provider_subscriptions')
          .update({ corridas_usadas: 0 })
          .eq('provider_id', provider_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "deactivate_plan": {
        if (!provider_id) throw new Error("provider_id é obrigatório");

        await supabaseClient
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
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
