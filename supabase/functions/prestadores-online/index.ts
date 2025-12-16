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

    // Use service role key to bypass RLS and ensure all data is accessible
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calcular tempo limite - prestadores vistos nos últimos 30 minutos são considerados online
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    console.log('Checking providers seen after:', thirtyMinutesAgo);

    // Get online providers with their details - baseado em last_seen_at (30 min) OU is_online = true
    const { data: onlineStatus, error: statusError } = await supabase
      .from('provider_online_status')
      .select(`
        id,
        provider_id,
        latitude,
        longitude,
        last_seen_at,
        is_online,
        providers (
          id,
          name,
          whatsapp,
          has_patins,
          service_types,
          base_price,
          price_per_km,
          patins_extra_price,
          slug,
          state_uf,
          region
        )
      `)
      .or(`is_online.eq.true,last_seen_at.gte.${thirtyMinutesAgo}`);

    if (statusError) {
      console.error('Error fetching online providers:', statusError);
      throw statusError;
    }

    console.log(`Found ${onlineStatus?.length || 0} online providers`);
    
    // Log each provider for debugging
    (onlineStatus || []).forEach((status: any) => {
      console.log(`Provider: ${status.providers?.name}, ID: ${status.provider_id}, Coords: ${status.latitude}, ${status.longitude}`);
    });

    // Transform data to include provider info with current location
    const providers = (onlineStatus || [])
      .filter((status: any) => status.providers !== null) // Filter out any with null provider data
      .map((status: any) => ({
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
        slug: status.providers?.slug,
        state_uf: status.providers?.state_uf,
        region: status.providers?.region,
        last_seen_at: status.last_seen_at,
      }));

    console.log(`Returning ${providers.length} providers after filtering`);

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