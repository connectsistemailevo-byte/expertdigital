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
    console.log('atualizar-localizacao-prestador function called');

    const { prestadorId, latitude, longitude, offline } = await req.json();

    if (!prestadorId) {
      return new Response(JSON.stringify({ error: 'prestadorId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // If offline flag is set, mark provider as offline
    if (offline === true) {
      console.log(`Marking provider ${prestadorId} as offline`);
      
      const { error } = await supabase
        .from('provider_online_status')
        .update({ 
          is_online: false,
          updated_at: new Date().toISOString()
        })
        .eq('provider_id', prestadorId);

      if (error) {
        console.error('Error marking offline:', error);
        throw error;
      }

      return new Response(JSON.stringify({ success: true, status: 'offline' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Update or insert location
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return new Response(JSON.stringify({ error: 'latitude and longitude are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`Updating location for provider ${prestadorId}: ${latitude}, ${longitude}`);

    // Use upsert to insert or update
    const { data, error } = await supabase
      .from('provider_online_status')
      .upsert({
        provider_id: prestadorId,
        latitude,
        longitude,
        is_online: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'provider_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating location:', error);
      throw error;
    }

    console.log('Location updated successfully:', data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error in atualizar-localizacao-prestador:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
