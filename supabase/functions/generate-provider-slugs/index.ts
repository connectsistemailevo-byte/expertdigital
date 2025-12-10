import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[GENERATE-SLUG] ${step}`, details ? JSON.stringify(details) : '');
};

// Função para gerar slug a partir do nome
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Iniciando geração de slugs');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todos os prestadores sem slug
    const { data: providers, error: fetchError } = await supabase
      .from('providers')
      .select('id, name, slug')
      .is('slug', null);

    if (fetchError) {
      throw fetchError;
    }

    logStep('Prestadores sem slug encontrados', { count: providers?.length || 0 });

    if (!providers || providers.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Todos os prestadores já possuem slug',
        updated: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar todos os slugs existentes para evitar duplicatas
    const { data: existingSlugs } = await supabase
      .from('providers')
      .select('slug')
      .not('slug', 'is', null);

    const usedSlugs = new Set((existingSlugs || []).map(p => p.slug));

    let updatedCount = 0;
    
    for (const provider of providers) {
      const baseSlug = generateSlug(provider.name);
      let slug = baseSlug;
      let counter = 1;

      // Garantir slug único
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      usedSlugs.add(slug);

      // Atualizar prestador com o slug
      const { error: updateError } = await supabase
        .from('providers')
        .update({ slug })
        .eq('id', provider.id);

      if (updateError) {
        logStep('Erro ao atualizar prestador', { id: provider.id, error: updateError });
      } else {
        logStep('Slug gerado', { id: provider.id, name: provider.name, slug });
        updatedCount++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${updatedCount} prestadores atualizados com slugs`,
      updated: updatedCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep('Erro', { error: error.message });
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
