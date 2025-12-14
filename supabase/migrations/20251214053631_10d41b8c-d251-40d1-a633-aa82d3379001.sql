-- Adicionar coluna state_uf para armazenar o estado do prestador
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS state_uf text;

-- Adicionar índice para busca por estado
CREATE INDEX IF NOT EXISTS idx_providers_state_uf ON public.providers(state_uf);

-- Comentário explicativo
COMMENT ON COLUMN public.providers.state_uf IS 'Sigla do estado (UF) onde o prestador atua';