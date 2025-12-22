-- Adicionar campo para valor por km do retorno
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS return_price_per_km numeric DEFAULT NULL;

-- Criar tabela para estatísticas de escaneamento do QR Code
CREATE TABLE IF NOT EXISTS public.qr_code_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  scanned_at timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text,
  ip_hash text,
  referrer text
);

-- Habilitar RLS
ALTER TABLE public.qr_code_scans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can insert scan" 
ON public.qr_code_scans 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view scans" 
ON public.qr_code_scans 
FOR SELECT 
USING (true);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_qr_code_scans_provider_id ON public.qr_code_scans(provider_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_scans_scanned_at ON public.qr_code_scans(scanned_at);