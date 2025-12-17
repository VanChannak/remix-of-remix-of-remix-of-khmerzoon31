import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TMDB_API_KEY = "5cfa727c2f549c594772a50e10e3f272";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TMDBPerson {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  gender: number;
  popularity: number;
  also_known_as: string[];
  homepage: string | null;
}

interface TMDBCredit {
  id: number;
  title?: string;
  name?: string;
  character?: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  overview: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tmdbPersonId, actorName } = await req.json();
    
    let personId = tmdbPersonId;
    
    // If no tmdbPersonId provided, search by actor name
    if (!personId && actorName) {
      console.log('Searching TMDB for actor:', actorName);
      
      const searchResponse = await fetch(
        `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(actorName)}`
      );
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.results && searchData.results.length > 0) {
          personId = searchData.results[0].id;
          console.log('Found person ID from search:', personId);
        }
      }
    }
    
    if (!personId) {
      // Return empty data if no person found
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            person: null,
            movieCredits: [],
            tvCredits: [],
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('Fetching TMDB data for person ID:', personId);

    // Fetch person details
    const personResponse = await fetch(
      `${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}`
    );

    if (!personResponse.ok) {
      throw new Error(`TMDB API error: ${personResponse.statusText}`);
    }

    const person: TMDBPerson = await personResponse.json();
    console.log('Fetched person:', person.name);

    // Fetch combined credits (movies + TV shows)
    const creditsResponse = await fetch(
      `${TMDB_BASE_URL}/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}`
    );

    let movieCredits: TMDBCredit[] = [];
    let tvCredits: TMDBCredit[] = [];

    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json();
      
      // Process movie credits
      movieCredits = (creditsData.cast || [])
        .filter((credit: any) => credit.media_type === 'movie')
        .map((credit: any) => ({
          id: credit.id,
          title: credit.title,
          character: credit.character,
          media_type: 'movie' as const,
          poster_path: credit.poster_path,
          release_date: credit.release_date,
          vote_average: credit.vote_average || 0,
          overview: credit.overview || '',
        }))
        .sort((a: any, b: any) => {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateB - dateA;
        });

      // Process TV credits
      tvCredits = (creditsData.cast || [])
        .filter((credit: any) => credit.media_type === 'tv')
        .map((credit: any) => ({
          id: credit.id,
          name: credit.name,
          character: credit.character,
          media_type: 'tv' as const,
          poster_path: credit.poster_path,
          first_air_date: credit.first_air_date,
          vote_average: credit.vote_average || 0,
          overview: credit.overview || '',
        }))
        .sort((a: any, b: any) => {
          const dateA = a.first_air_date ? new Date(a.first_air_date).getTime() : 0;
          const dateB = b.first_air_date ? new Date(b.first_air_date).getTime() : 0;
          return dateB - dateA;
        });

      console.log(`Found ${movieCredits.length} movies and ${tvCredits.length} TV shows`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          person,
          movieCredits,
          tvCredits,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching TMDB cast data:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cast data',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
