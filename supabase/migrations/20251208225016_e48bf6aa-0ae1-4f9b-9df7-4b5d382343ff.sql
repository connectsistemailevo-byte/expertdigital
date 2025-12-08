-- Add policy for providers to update their own records by WhatsApp
CREATE POLICY "Providers can update their own records by whatsapp"
ON public.providers
FOR UPDATE
USING (true)
WITH CHECK (true);