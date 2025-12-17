import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const TMDB_API_KEY = "5cfa727c2f549c594772a50e10e3f272";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  imdb_id?: string | null;
}

interface TMDBCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface TMDBVideo {
  type: string;
  site: string;
  key: string;
  official: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tmdbIds } = await req.json();
    console.log('Importing Movies with IDs:', tmdbIds);

    if (!tmdbIds || !Array.isArray(tmdbIds) || tmdbIds.length === 0) {
      throw new Error('No TMDB IDs provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      success: [] as number[],
      failed: [] as { id: number; error: string }[],
    };

    for (const tmdbId of tmdbIds) {
      try {
        console.log(`Fetching movie for TMDB ID: ${tmdbId}`);
        
        // Fetch movie details
        const response = await fetch(
          `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
        );

        if (!response.ok) throw new Error(`TMDB API error: ${response.statusText}`);

        const movie: TMDBMovie = await response.json();
        console.log(`Fetched movie: ${movie.title}`);

        // Store genres in database
        if (movie.genres && movie.genres.length > 0) {
          for (const genre of movie.genres) {
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

        // Fetch and store language
        if (movie.id) {
          try {
            const detailsResponse = await fetch(
              `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
            );
            if (detailsResponse.ok) {
              const details = await detailsResponse.json();
              if (details.original_language) {
                const langResponse = await fetch(
                  `${TMDB_BASE_URL}/configuration/languages?api_key=${TMDB_API_KEY}`
                );
                if (langResponse.ok) {
                  const languages = await langResponse.json();
                  const language = languages.find((l: any) => l.iso_639_1 === details.original_language);
                  if (language) {
                    await supabase.from('languages').upsert({
                      iso_639_1: language.iso_639_1,
                      name: language.name || language.english_name,
                      english_name: language.english_name,
                      tmdb_data: language,
                    }, { onConflict: 'iso_639_1' });
                  }
                }
              }
            }
          } catch (err) {
            console.error(`Failed to store language:`, err);
          }
        }

        // Fetch cast
        let cast: TMDBCast[] = [];
        try {
          const creditsResponse = await fetch(
            `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`
          );
          if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            cast = creditsData.cast?.slice(0, 20) || [];
          }
        } catch (err) {
          console.error(`Failed to fetch cast for ${tmdbId}:`, err);
        }

        // Fetch trailer
        let trailerUrl = null;
        try {
          const videosResponse = await fetch(
            `${TMDB_BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}`
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

        const movieData = {
          title: movie.title,
          type: 'movie' as const,
          access: 'free' as const,
          genre: movie.genres?.map(g => g.name).join(', ') || 'Unknown',
          release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : new Date().getFullYear(),
          rating: Math.round((movie.vote_average || 0) * 10) / 10,
          price: null as number | null,
          thumbnail: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder.svg',
          backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
          trailer_url: trailerUrl,
          description: movie.overview || 'No description available',
          imdb_id: movie.imdb_id ?? null,
          tmdb_id: tmdbId.toString(),
        };

        const { data: inserted, error: insertError } = await supabase
          .from('movies')
          .insert(movieData)
          .select()
          .single();

        if (insertError) {
          console.error(`Database error for ${tmdbId}:`, insertError);
          results.failed.push({ id: tmdbId, error: insertError.message });
          continue;
        }

        console.log(`Inserted movie with id ${inserted.id}`);

        // Insert cast members
        if (cast.length > 0) {
          const castData = cast.map(member => ({
            movie_id: inserted.id,
            actor_name: member.name,
            character_name: member.character,
            profile_url: member.profile_path 
              ? `https://image.tmdb.org/t/p/w500${member.profile_path}` 
              : null,
            order_index: member.order,
          }));

          const { error: castError } = await supabase
            .from('movie_cast')
            .insert(castData);

          if (castError) {
            console.error(`Failed to insert cast for ${tmdbId}:`, castError);
          } else {
            console.log(`Inserted ${castData.length} cast members for movie ${inserted.id}`);
          }
        }

        results.success.push(tmdbId);
      } catch (err) {
        console.error(`Failed to import movie ${tmdbId}:`, err);
        results.failed.push({ id: tmdbId, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    console.log('Import movie results:', results);

    return new Response(
      JSON.stringify({
        message: `Imported ${results.success.length} of ${tmdbIds.length} movies`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in import-tmdb-movies function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
