-- Create table for online providers with real-time location tracking
CREATE TABLE public.provider_online_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id)
);

-- Enable RLS
ALTER TABLE public.provider_online_status ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read online providers (public data for clients)
CREATE POLICY "Anyone can view online providers"
ON public.provider_online_status
FOR SELECT
USING (is_online = true);

-- Allow anyone to insert/update (providers will update their own status)
CREATE POLICY "Anyone can insert provider status"
ON public.provider_online_status
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update provider status"
ON public.provider_online_status
FOR UPDATE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_provider_online_status_updated_at
BEFORE UPDATE ON public.provider_online_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_online_status;