import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { animeId } = await req.json();
    console.log('Importing episodes for anime:', { animeId });

    if (!animeId) {
      throw new Error('animeId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch anime details
    console.log(`Fetching anime data from database`);
    const { data: anime, error: animeError } = await supabase
      .from('animes')
      .select('*')
      .eq('id', animeId)
      .single();

    if (animeError) throw animeError;

    const episodeCount = anime.episodes_count || 0;

    if (episodeCount === 0) {
      throw new Error('Anime has no episode count set. Please set episodes_count first.');
    }

    console.log(`Creating episodes for anime with ${episodeCount} episodes`);

    // Create or get default season for this anime
    let seasonId: string;
    const { data: existingSeason } = await supabase
      .from('seasons')
      .select('id')
      .eq('media_id', animeId)
      .eq('season_number', 1)
      .maybeSingle();

    if (existingSeason) {
      seasonId = existingSeason.id;
      console.log(`Using existing season`);
    } else {
      const { data: newSeason, error: seasonError } = await supabase
        .from('seasons')
        .insert({
          media_id: animeId,
          season_number: 1,
          name: 'Season 1',
          overview: `Episodes of ${anime.title}`,
          episode_count: episodeCount,
        })
        .select()
        .single();

      if (seasonError) throw seasonError;
      seasonId = newSeason.id;
      console.log(`Created new season`);
    }

    // Delete existing episodes for this season to avoid duplicates
    await supabase
      .from('episodes')
      .delete()
      .eq('season_id', seasonId);

    // Create episodes
    const episodesData = Array.from({ length: episodeCount }, (_, i) => ({
      season_id: seasonId,
      episode_number: i + 1,
      name: `Episode ${i + 1}`,
      overview: '',
      air_date: null,
      still_path: anime.thumbnail,
      runtime: null,
    }));

    const { error: episodesError } = await supabase
      .from('episodes')
      .insert(episodesData);

    if (episodesError) {
      console.error('Error inserting episodes:', episodesError);
      throw episodesError;
    }

    console.log(`Import completed: ${episodeCount} episodes created`);

    return new Response(
      JSON.stringify({
        message: `Successfully created ${episodeCount} episodes`,
        episodesImported: episodeCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in import-anime-episodes function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
