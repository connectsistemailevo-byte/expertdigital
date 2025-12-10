-- Criar bucket para logos dos prestadores
INSERT INTO storage.buckets (id, name, public) 
VALUES ('provider-logos', 'provider-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para visualizar logos (público)
CREATE POLICY "Logos são públicos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'provider-logos');

-- Policy para upload de logos (qualquer um pode fazer upload por enquanto, o admin controla)
CREATE POLICY "Upload de logos permitido" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'provider-logos');

-- Policy para deletar logos
CREATE POLICY "Delete de logos permitido" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'provider-logos');

-- Policy para atualizar logos
CREATE POLICY "Update de logos permitido" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'provider-logos');