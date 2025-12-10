-- Adicionar constraint única no campo whatsapp para evitar duplicados
ALTER TABLE public.providers ADD CONSTRAINT providers_whatsapp_unique UNIQUE (whatsapp);