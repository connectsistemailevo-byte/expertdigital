-- Create providers table
CREATE TABLE public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  has_patins BOOLEAN NOT NULL DEFAULT false,
  service_types TEXT[] NOT NULL DEFAULT '{}',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read providers (for clients to see available providers)
CREATE POLICY "Anyone can view providers" 
ON public.providers 
FOR SELECT 
USING (true);

-- Allow anyone to insert providers (for provider registration)
CREATE POLICY "Anyone can register as provider" 
ON public.providers 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for providers table
ALTER PUBLICATION supabase_realtime ADD TABLE public.providers;