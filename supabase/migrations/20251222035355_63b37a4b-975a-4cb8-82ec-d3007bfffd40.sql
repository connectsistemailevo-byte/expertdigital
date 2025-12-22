-- Adicionar coluna para valor de retorno na tabela providers
ALTER TABLE public.providers 
ADD COLUMN return_price numeric DEFAULT NULL,
ADD COLUMN return_enabled boolean NOT NULL DEFAULT false;

-- Adicionar comentários descritivos
COMMENT ON COLUMN public.providers.return_price IS 'Valor cobrado pelo retorno (ida e volta)';
COMMENT ON COLUMN public.providers.return_enabled IS 'Se o prestador oferece serviço de retorno';