-- Add column to hide prices for specific providers
ALTER TABLE public.providers 
ADD COLUMN hide_prices BOOLEAN NOT NULL DEFAULT false;