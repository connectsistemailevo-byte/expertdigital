-- Adicionar política de UPDATE para providers (necessário para editar cadastro)
CREATE POLICY "Anyone can update providers"
ON public.providers
FOR UPDATE
USING (true)
WITH CHECK (true);