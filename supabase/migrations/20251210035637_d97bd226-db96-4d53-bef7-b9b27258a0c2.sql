-- Enum para os tipos de plano
CREATE TYPE public.provider_plan AS ENUM ('basico', 'profissional', 'pro');

-- Tabela de assinaturas dos prestadores
CREATE TABLE public.provider_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  plano public.provider_plan,
  adesao_paga BOOLEAN NOT NULL DEFAULT false,
  mensalidade_atual NUMERIC(10,2) DEFAULT 0,
  limite_corridas INTEGER DEFAULT 0,
  corridas_usadas INTEGER NOT NULL DEFAULT 0,
  trial_ativo BOOLEAN NOT NULL DEFAULT true,
  trial_corridas_restantes INTEGER NOT NULL DEFAULT 10,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  adesao_paga_em TIMESTAMP WITH TIME ZONE,
  proxima_cobranca TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id)
);

-- Tabela de personalização do sistema para cada prestador
CREATE TABLE public.provider_customization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  company_name TEXT,
  custom_domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id)
);

-- Histórico de pagamentos
CREATE TABLE public.provider_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('adesao', 'mensalidade', 'dominio')),
  valor NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'falhou', 'reembolsado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para provider_subscriptions
CREATE POLICY "Providers can view own subscription" 
ON public.provider_subscriptions 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert subscriptions" 
ON public.provider_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update subscriptions" 
ON public.provider_subscriptions 
FOR UPDATE 
USING (true);

-- Políticas para provider_customization
CREATE POLICY "Anyone can view customization" 
ON public.provider_customization 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert customization" 
ON public.provider_customization 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update customization" 
ON public.provider_customization 
FOR UPDATE 
USING (true);

-- Políticas para provider_payments
CREATE POLICY "Anyone can view payments" 
ON public.provider_payments 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert payments" 
ON public.provider_payments 
FOR INSERT 
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_provider_subscriptions_updated_at
BEFORE UPDATE ON public.provider_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_customization_updated_at
BEFORE UPDATE ON public.provider_customization
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();