-- Adicionar coluna slug para subdomínios automáticos
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Criar índice para busca rápida por slug
CREATE INDEX IF NOT EXISTS idx_providers_slug ON public.providers (slug);

-- Criar índice para busca rápida por domínio customizado
CREATE INDEX IF NOT EXISTS idx_provider_customization_custom_domain ON public.provider_customization (custom_domain);

-- Atualizar policy para permitir busca por domínio
DROP POLICY IF EXISTS "Anyone can view customization" ON public.provider_customization;
CREATE POLICY "Anyone can view customization" 
ON public.provider_customization 
FOR SELECT 
USING (true);