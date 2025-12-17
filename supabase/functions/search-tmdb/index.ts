import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TMDB_API_KEY = "5cfa727c2f549c594772a50e10e3f272";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type = 'multi' } = await req.json();
    
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    
    console.log('Searching TMDB:', { query, type });
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Format results with poster URLs
    const results = data.results?.slice(0, 10).map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      type: item.media_type || type,
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : null,
      backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
      description: item.overview,
      releaseDate: item.release_date || item.first_air_date,
      genre_ids: item.genre_ids,
      rating: item.vote_average,
      tmdb_id: String(item.id),
      imdb_id: null, // Will be fetched if item is selected
    })) || [];

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error searching TMDB:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
