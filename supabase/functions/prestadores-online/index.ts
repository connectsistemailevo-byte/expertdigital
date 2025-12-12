import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('prestadores-online function called');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get online providers with their details
    const { data: onlineStatus, error: statusError } = await supabase
      .from('provider_online_status')
      .select(`
        id,
        provider_id,
        latitude,
        longitude,
        last_seen_at,
        providers (
          id,
          name,
          whatsapp,
          has_patins,
          service_types,
          base_price,
          price_per_km,
          patins_extra_price
        )
      `)
      .eq('is_online', true)
      .gte('last_seen_at', new Date(Date.now() - 60000).toISOString()); // Online in last 60 seconds

    if (statusError) {
      console.error('Error fetching online providers:', statusError);
      throw statusError;
    }

    console.log(`Found ${onlineStatus?.length || 0} online providers`);

    // Transform data to include provider info with current location
    const providers = (onlineStatus || []).map((status: any) => ({
      id: status.provider_id,
      name: status.providers?.name || 'Prestador',
      latitude: status.latitude,
      longitude: status.longitude,
      whatsapp: status.providers?.whatsapp,
      has_patins: status.providers?.has_patins,
      service_types: status.providers?.service_types,
      base_price: status.providers?.base_price || 50,
      price_per_km: status.providers?.price_per_km || 5,
      patins_extra_price: status.providers?.patins_extra_price || 30,
      last_seen_at: status.last_seen_at,
    }));

    return new Response(JSON.stringify({ providers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error in prestadores-online:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
