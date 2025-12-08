-- Add pricing fields to providers table
ALTER TABLE public.providers 
ADD COLUMN base_price DECIMAL(10,2) DEFAULT 50.00,
ADD COLUMN price_per_km DECIMAL(10,2) DEFAULT 5.00,
ADD COLUMN patins_extra_price DECIMAL(10,2) DEFAULT 30.00;