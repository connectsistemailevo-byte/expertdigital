-- Adicionar política para permitir DELETE na tabela providers
CREATE POLICY "Admin can delete providers" 
ON public.providers 
FOR DELETE 
USING (true);

-- Adicionar política para permitir DELETE na tabela provider_online_status
CREATE POLICY "Admin can delete provider status" 
ON public.provider_online_status 
FOR DELETE 
USING (true);

-- Adicionar política para permitir DELETE na tabela provider_customization
CREATE POLICY "Admin can delete customization" 
ON public.provider_customization 
FOR DELETE 
USING (true);

-- Adicionar política para permitir DELETE na tabela provider_payments
CREATE POLICY "Admin can delete payments" 
ON public.provider_payments 
FOR DELETE 
USING (true);

-- Adicionar política para permitir DELETE na tabela provider_subscriptions
CREATE POLICY "Admin can delete subscriptions" 
ON public.provider_subscriptions 
FOR DELETE 
USING (true);