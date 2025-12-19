-- Create table for simulation history (origin, destination, timestamp)
CREATE TABLE public.route_simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  origin_latitude double precision NOT NULL,
  origin_longitude double precision NOT NULL,
  origin_address text,
  destination_latitude double precision NOT NULL,
  destination_longitude double precision NOT NULL,
  destination_address text,
  distance_km double precision,
  duration_min integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on route_simulations
ALTER TABLE public.route_simulations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view simulations (admin panel)
CREATE POLICY "Anyone can view simulations" 
ON public.route_simulations 
FOR SELECT 
USING (true);

-- Allow anyone to insert simulations (client app)
CREATE POLICY "Anyone can insert simulations" 
ON public.route_simulations 
FOR INSERT 
WITH CHECK (true);

-- Create table for client locations (visitors to the site)
CREATE TABLE public.client_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  region text,
  city text,
  state_uf text,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on client_locations
ALTER TABLE public.client_locations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view client locations (admin panel)
CREATE POLICY "Anyone can view client locations" 
ON public.client_locations 
FOR SELECT 
USING (true);

-- Allow anyone to insert their location
CREATE POLICY "Anyone can insert client location" 
ON public.client_locations 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update client location (upsert)
CREATE POLICY "Anyone can update client location" 
ON public.client_locations 
FOR UPDATE 
USING (true);

-- Enable realtime for client_locations
ALTER TABLE public.client_locations REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_locations;