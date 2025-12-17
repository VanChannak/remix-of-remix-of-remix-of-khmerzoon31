import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const TMDB_API_KEY = "5cfa727c2f549c594772a50e10e3f272";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TMDBEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string;
  still_path: string;
  runtime: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mediaId, tmdbId } = await req.json();
    console.log('Importing episodes for series:', { mediaId, tmdbId });

    if (!mediaId || !tmdbId) {
      throw new Error('Both mediaId and tmdbId are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch TV show details from TMDB to get seasons
    console.log(`Fetching series data from TMDB ID: ${tmdbId}`);
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const show = await response.json();
    console.log(`Fetched show: ${show.name} with ${show.seasons?.length} seasons`);

    let totalEpisodesImported = 0;
    let totalSeasonsImported = 0;

    // Process each season
    for (const tmdbSeason of show.seasons || []) {
      // Skip special seasons (season 0)
      if (tmdbSeason.season_number === 0) continue;

      try {
        console.log(`Processing season ${tmdbSeason.season_number}`);
        
        // Check if season already exists
        const { data: existingSeason } = await supabase
          .from('seasons')
          .select('id')
          .eq('media_id', mediaId)
          .eq('season_number', tmdbSeason.season_number)
          .maybeSingle();

        let seasonId: string;

        if (existingSeason) {
          // Update existing season
          const { data: updatedSeason, error: updateError } = await supabase
            .from('seasons')
            .update({
              name: tmdbSeason.name,
              overview: tmdbSeason.overview || '',
              air_date: tmdbSeason.air_date || null,
              poster_path: tmdbSeason.poster_path 
                ? `https://image.tmdb.org/t/p/w500${tmdbSeason.poster_path}`
                : null,
              episode_count: tmdbSeason.episode_count,
            })
            .eq('id', existingSeason.id)
            .select()
            .single();

          if (updateError) {
            console.error(`Error updating season ${tmdbSeason.season_number}:`, updateError);
            continue;
          }
          seasonId = updatedSeason.id;
          console.log(`Updated existing season ${tmdbSeason.season_number}`);
        } else {
          // Insert new season
          const { data: insertedSeason, error: insertError } = await supabase
            .from('seasons')
            .insert({
              media_id: mediaId,
              season_number: tmdbSeason.season_number,
              name: tmdbSeason.name,
              overview: tmdbSeason.overview || '',
              air_date: tmdbSeason.air_date || null,
              poster_path: tmdbSeason.poster_path 
                ? `https://image.tmdb.org/t/p/w500${tmdbSeason.poster_path}`
                : null,
              episode_count: tmdbSeason.episode_count,
            })
            .select()
            .single();

          if (insertError) {
            console.error(`Error inserting season ${tmdbSeason.season_number}:`, insertError);
            continue;
          }
          seasonId = insertedSeason.id;
          console.log(`Inserted new season ${tmdbSeason.season_number}`);
          totalSeasonsImported++;
        }

        // Fetch detailed season data including episodes
        const seasonResponse = await fetch(
          `${TMDB_BASE_URL}/tv/${tmdbId}/season/${tmdbSeason.season_number}?api_key=${TMDB_API_KEY}`
        );

        if (!seasonResponse.ok) {
          console.error(`Failed to fetch season ${tmdbSeason.season_number} details`);
          continue;
        }

        const seasonData = await seasonResponse.json();

        // Delete existing episodes for this season to avoid duplicates
        await supabase
          .from('episodes')
          .delete()
          .eq('season_id', seasonId);

        // Insert episodes
        if (seasonData.episodes && seasonData.episodes.length > 0) {
          const episodesData = seasonData.episodes.map((ep: TMDBEpisode) => ({
            season_id: seasonId,
            episode_number: ep.episode_number,
            name: ep.name,
            overview: ep.overview || '',
            air_date: ep.air_date || null,
            still_path: ep.still_path 
              ? `https://image.tmdb.org/t/p/w500${ep.still_path}`
              : null,
            runtime: ep.runtime || null,
          }));

          const { error: episodesError } = await supabase
            .from('episodes')
            .insert(episodesData);

          if (episodesError) {
            console.error(`Error inserting episodes for season ${tmdbSeason.season_number}:`, episodesError);
          } else {
            totalEpisodesImported += episodesData.length;
            console.log(`Imported ${episodesData.length} episodes for season ${tmdbSeason.season_number}`);
          }
        }
      } catch (seasonError) {
        console.error(`Failed to process season ${tmdbSeason.season_number}:`, seasonError);
      }
    }

    console.log(`Import completed: ${totalSeasonsImported} seasons, ${totalEpisodesImported} episodes`);

    return new Response(
      JSON.stringify({
        message: `Successfully imported ${totalEpisodesImported} episodes across ${totalSeasonsImported} seasons`,
        seasonsImported: totalSeasonsImported,
        episodesImported: totalEpisodesImported,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in import-series-episodes function:', error);
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
