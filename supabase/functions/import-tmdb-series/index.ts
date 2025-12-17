import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const TMDB_API_KEY = "5cfa727c2f549c594772a50e10e3f272";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TMDBShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  last_air_date: string;
  status: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path: string;
  backdrop_path: string;
  original_language: string;
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  genres: { id: number; name: string }[];
  seasons: TMDBSeason[];
  networks: { id: number; name: string; logo_path: string; origin_country: string }[];
  production_companies: { id: number; name: string; logo_path: string }[];
}

interface TMDBCast {
  id: number;
  name: string;
  character: string;
  profile_path: string;
  order: number;
}

interface TMDBSeason {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string;
  poster_path: string;
  episode_count: number;
}

interface TMDBEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string;
  still_path: string;
  runtime: number;
}

interface TMDBVideo {
  type: string;
  site: string;
  key: string;
  official: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tmdbIds } = await req.json();
    console.log('Importing TV series with IDs:', tmdbIds);

    if (!tmdbIds || !Array.isArray(tmdbIds) || tmdbIds.length === 0) {
      throw new Error('No TMDB IDs provided');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      success: [] as number[],
      failed: [] as { id: number; error: string }[],
    };

    // Process each TMDB ID
    for (const tmdbId of tmdbIds) {
      try {
        console.log(`Fetching data for TMDB ID: ${tmdbId}`);
        
        // Fetch TV show details from TMDB
        const response = await fetch(
          `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`
        );

        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.statusText}`);
        }

        const show: TMDBShow = await response.json();
        console.log(`Fetched show: ${show.name}`);

        // Store genres in database
        if (show.genres && show.genres.length > 0) {
          for (const genre of show.genres) {
            try {
              await supabase.from('genres').upsert({
                tmdb_id: genre.id,
                name: genre.name,
              }, { onConflict: 'tmdb_id' });
            } catch (err) {
              console.error(`Failed to store genre ${genre.name}:`, err);
            }
          }
        }

        // Store language
        if (show.original_language) {
          try {
            const langResponse = await fetch(
              `${TMDB_BASE_URL}/configuration/languages?api_key=${TMDB_API_KEY}`
            );
            if (langResponse.ok) {
              const languages = await langResponse.json();
              const language = languages.find((l: any) => l.iso_639_1 === show.original_language);
              if (language) {
                await supabase.from('languages').upsert({
                  iso_639_1: language.iso_639_1,
                  name: language.name || language.english_name,
                  english_name: language.english_name,
                  tmdb_data: language,
                }, { onConflict: 'iso_639_1' });
              }
            }
          } catch (err) {
            console.error(`Failed to store language:`, err);
          }
        }

        // Store networks (TV networks/broadcasters)
        if (show.networks && show.networks.length > 0) {
          for (const network of show.networks) {
            try {
              await supabase.from('networks').upsert({
                tmdb_id: network.id,
                name: network.name,
                logo_url: network.logo_path ? `https://image.tmdb.org/t/p/original${network.logo_path}` : null,
                origin_country: network.origin_country || null,
              }, { onConflict: 'tmdb_id' });
              console.log(`Stored network: ${network.name}`);
            } catch (err) {
              console.error(`Failed to store network ${network.name}:`, err);
            }
          }
        }

        // Fetch cast and crew details
        const creditsResponse = await fetch(
          `${TMDB_BASE_URL}/tv/${tmdbId}/credits?api_key=${TMDB_API_KEY}`
        );
        
        let cast: TMDBCast[] = [];
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json();
          cast = creditsData.cast?.slice(0, 20) || []; // Get top 20 cast members
        }

        // Fetch trailer
        let trailerUrl = null;
        try {
          const videosResponse = await fetch(
            `${TMDB_BASE_URL}/tv/${tmdbId}/videos?api_key=${TMDB_API_KEY}`
          );
          if (videosResponse.ok) {
            const videosData = await videosResponse.json();
            const trailer = videosData.results?.find(
              (video: TMDBVideo) => 
                video.type === 'Trailer' && 
                video.site === 'YouTube' && 
                video.official
            ) || videosData.results?.[0];
            
            if (trailer) {
              trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch trailer for ${tmdbId}:`, err);
        }

        // Prepare comprehensive data for database
        const mediaData = {
          title: show.name,
          type: 'series' as const,
          access: 'free' as const,
          genre: show.genres.map(g => g.name).join(', ') || 'Unknown',
          release_year: show.first_air_date 
            ? new Date(show.first_air_date).getFullYear() 
            : new Date().getFullYear(),
          rating: Math.round(show.vote_average * 10) / 10,
          thumbnail: show.poster_path 
            ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
            : '/placeholder.svg',
          description: show.overview || 'No description available',
          tmdb_id: tmdbId.toString(),
          overview: show.overview || null,
          first_air_date: show.first_air_date || null,
          last_air_date: show.last_air_date || null,
          status: show.status || null,
          episode_run_time: show.episode_run_time || null,
          number_of_seasons: show.number_of_seasons || null,
          number_of_episodes: show.number_of_episodes || null,
          popularity: show.popularity || null,
          vote_count: show.vote_count || null,
          poster_url: show.poster_path 
            ? `https://image.tmdb.org/t/p/original${show.poster_path}`
            : null,
          backdrop_url: show.backdrop_path 
            ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
            : null,
          trailer_url: trailerUrl,
          original_language: show.original_language || null,
        };

        // Insert into database
        const { data: insertedMedia, error: mediaError } = await supabase
          .from('series')
          .insert(mediaData)
          .select()
          .single();

        if (mediaError) {
          console.error(`Database error for ${tmdbId}:`, mediaError);
          results.failed.push({ id: tmdbId, error: mediaError.message });
          continue;
        }

        console.log(`Successfully imported series: ${show.name}`);

        // Insert genres
        if (show.genres && show.genres.length > 0) {
          const genresData = show.genres.map(genre => ({
            series_id: insertedMedia.id,
            genre_id: genre.id,
            genre_name: genre.name,
          }));

          // Delete existing genres first to avoid duplicates
          await supabase
            .from('series_genres')
            .delete()
            .eq('series_id', insertedMedia.id);

          const { error: genresError } = await supabase
            .from('series_genres')
            .insert(genresData);

          if (genresError) {
            console.error(`Error inserting genres:`, genresError);
          } else {
            console.log(`Imported ${genresData.length} genres`);
          }
        }

        // Insert cast
        if (cast && cast.length > 0) {
          const castData = cast.map(actor => ({
            series_id: insertedMedia.id,
            actor_name: actor.name,
            character_name: actor.character,
            profile_url: actor.profile_path 
              ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
              : null,
            order_index: actor.order,
            tmdb_id: actor.id, // Include TMDB person ID
          }));

          // Delete existing cast first
          await supabase
            .from('series_cast')
            .delete()
            .eq('series_id', insertedMedia.id);

          const { error: castError } = await supabase
            .from('series_cast')
            .insert(castData);

          if (castError) {
            console.error(`Error inserting cast:`, castError);
          } else {
            console.log(`Imported ${castData.length} cast members with TMDB IDs`);
          }
        }

        // Insert production companies
        if (show.production_companies && show.production_companies.length > 0) {
          const producersData = show.production_companies.map(company => ({
            series_id: insertedMedia.id,
            company_name: company.name,
            logo_url: company.logo_path 
              ? `https://image.tmdb.org/t/p/w500${company.logo_path}`
              : null,
          }));

          // Delete existing producers first
          await supabase
            .from('series_producers')
            .delete()
            .eq('series_id', insertedMedia.id);

          const { error: producersError } = await supabase
            .from('series_producers')
            .insert(producersData);

          if (producersError) {
            console.error(`Error inserting producers:`, producersError);
          } else {
            console.log(`Imported ${producersData.length} production companies`);
          }
        }

        // Fetch and import seasons and episodes
        for (const tmdbSeason of show.seasons) {
          // Skip special seasons (season 0)
          if (tmdbSeason.season_number === 0) continue;

          try {
            console.log(`Fetching season ${tmdbSeason.season_number} for ${show.name}`);
            
            // Fetch detailed season data including episodes
            const seasonResponse = await fetch(
              `${TMDB_BASE_URL}/tv/${tmdbId}/season/${tmdbSeason.season_number}?api_key=${TMDB_API_KEY}`
            );

            if (!seasonResponse.ok) {
              console.error(`Failed to fetch season ${tmdbSeason.season_number}`);
              continue;
            }

            const seasonData = await seasonResponse.json();

            // Insert season
            const { data: insertedSeason, error: seasonError } = await supabase
              .from('seasons')
              .insert({
                media_id: insertedMedia.id,
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

            if (seasonError) {
              console.error(`Error inserting season ${tmdbSeason.season_number}:`, seasonError);
              continue;
            }

            // Insert episodes
            if (seasonData.episodes && seasonData.episodes.length > 0) {
              const episodesData = seasonData.episodes.map((ep: TMDBEpisode) => ({
                season_id: insertedSeason.id,
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
                console.log(`Imported ${episodesData.length} episodes for season ${tmdbSeason.season_number}`);
              }
            }
          } catch (seasonError) {
            console.error(`Failed to import season ${tmdbSeason.season_number}:`, seasonError);
          }
        }

        results.success.push(tmdbId);
        console.log(`Completed import of ${show.name} with all seasons and episodes`);
      } catch (error) {
        console.error(`Failed to import ${tmdbId}:`, error);
        results.failed.push({ 
          id: tmdbId, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('Import results:', results);

    return new Response(
      JSON.stringify({
        message: `Imported ${results.success.length} of ${tmdbIds.length} series`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in import-tmdb-series function:', error);
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
