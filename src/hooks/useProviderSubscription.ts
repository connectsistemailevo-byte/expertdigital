import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  trial_ativo: boolean;
  trial_corridas_restantes: number;
  adesao_paga: boolean;
  plano: 'basico' | 'profissional' | 'pro' | null;
  corridas_usadas: number;
  limite_corridas: number;
  blocked: boolean;
  block_reason?: 'trial_exhausted' | 'limit_reached' | 'no_plan';
  block_message?: string;
}

interface IncrementResult {
  success: boolean;
  blocked: boolean;
  reason?: string;
  message?: string;
  trial_ativo?: boolean;
  trial_corridas_restantes?: number;
  corridas_usadas?: number;
  limite_corridas?: number;
}

export function useProviderSubscription() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  // Verificar status da subscription
  const checkSubscription = useCallback(async (providerId: string): Promise<SubscriptionStatus | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-provider-subscription', {
        body: { provider_id: providerId },
      });

      if (error) throw error;

      if (!data?.found) {
        return null;
      }

      const sub = data.subscription;
      const subscriptionStatus: SubscriptionStatus = {
        trial_ativo: sub?.trial_ativo ?? true,
        trial_corridas_restantes: sub?.trial_corridas_restantes ?? 10,
        adesao_paga: sub?.adesao_paga ?? false,
        plano: sub?.plano ?? null,
        corridas_usadas: sub?.corridas_usadas ?? 0,
        limite_corridas: sub?.limite_corridas ?? 0,
        blocked: data.needs_plan_selection ?? false,
        block_reason: data.needs_plan_selection ? 'no_plan' : undefined,
      };

      setStatus(subscriptionStatus);
      return subscriptionStatus;
    } catch (err) {
      console.error('Error checking subscription:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Incrementar corrida (decrementar do trial ou do plano)
  const incrementRide = useCallback(async (providerId: string): Promise<IncrementResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('increment-provider-rides', {
        body: { provider_id: providerId },
      });

      if (error) throw error;

      const result: IncrementResult = {
        success: data?.success ?? false,
        blocked: data?.blocked ?? false,
        reason: data?.reason,
        message: data?.message,
        trial_ativo: data?.trial_ativo,
        trial_corridas_restantes: data?.trial_corridas_restantes,
        corridas_usadas: data?.corridas_usadas,
        limite_corridas: data?.limite_corridas,
      };

      // Atualizar status local
      if (result.success && status) {
        setStatus({
          ...status,
          trial_corridas_restantes: result.trial_corridas_restantes ?? status.trial_corridas_restantes,
          corridas_usadas: result.corridas_usadas ?? status.corridas_usadas,
        });
      }

      return result;
    } catch (err) {
      console.error('Error incrementing ride:', err);
      return {
        success: false,
        blocked: true,
        reason: 'error',
        message: 'Erro ao registrar corrida',
      };
    } finally {
      setLoading(false);
    }
  }, [status]);

  return {
    loading,
    status,
    checkSubscription,
    incrementRide,
  };
}
