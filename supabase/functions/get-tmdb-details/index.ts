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
    const { tmdb_id, type } = await req.json();
    
    if (!tmdb_id || !type) {
      throw new Error('tmdb_id and type are required');
    }

    // Map type to TMDB endpoint
    const mediaType = type === 'anime' ? 'tv' : type;
    const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdb_id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=external_ids,videos`;
    
    console.log('Fetching TMDB details:', { tmdb_id, type, mediaType });
    
    const response = await fetch(detailsUrl);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract trailer URL from videos with detailed logging
    let trailerUrl = null;
    console.log('Videos data:', JSON.stringify(data.videos, null, 2));
    
    if (data.videos?.results && Array.isArray(data.videos.results)) {
      console.log('Found videos:', data.videos.results.length);
      
      // Try to find official trailer first
      const trailer = data.videos.results.find(
        (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
      );
      
      if (trailer) {
        trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
        console.log('Found trailer:', trailerUrl);
      } else {
        // If no trailer, try to find any YouTube video
        const anyVideo = data.videos.results.find(
          (video: any) => video.site === 'YouTube'
        );
        if (anyVideo) {
          trailerUrl = `https://www.youtube.com/watch?v=${anyVideo.key}`;
          console.log('Found alternative video:', trailerUrl);
        } else {
          console.log('No YouTube videos found');
        }
      }
    } else {
      console.log('No videos data available');
    }
    
    // Format the detailed data
    const details = {
      title: data.title || data.name,
      description: data.overview,
      thumbnail: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      backdrop_url: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
      release_date: data.release_date || data.first_air_date,
      genre: data.genres?.map((g: any) => g.name).join(', ') || '',
      tmdb_id: String(data.id),
      imdb_id: data.external_ids?.imdb_id || null,
      trailer_url: trailerUrl,
      rating: data.vote_average,
      type: type,
    };

    return new Response(
      JSON.stringify(details),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching TMDB details:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
