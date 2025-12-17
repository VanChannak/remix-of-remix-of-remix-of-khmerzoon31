import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { anilistId, type } = await req.json();

    if (!anilistId) {
      return new Response(
        JSON.stringify({ error: "AniList ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let query = "";
    let variables = {};

    if (type === "anime") {
      // Fetch anime details with characters and voice actors
      query = `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            description
            coverImage {
              extraLarge
              large
            }
            bannerImage
            trailer {
              id
              site
            }
            genres
            studios {
              nodes {
                name
              }
            }
            source
            format
            status
            episodes
            averageScore
            seasonYear
            characters(sort: ROLE, perPage: 25) {
              edges {
                role
                node {
                  id
                  name {
                    full
                    native
                    alternative
                  }
                  image {
                    large
                  }
                  description
                  age
                  gender
                  dateOfBirth {
                    year
                    month
                    day
                  }
                }
                voiceActors(language: JAPANESE) {
                  id
                  name {
                    full
                    native
                  }
                  image {
                    large
                  }
                  language
                  dateOfBirth {
                    year
                    month
                    day
                  }
                  age
                  gender
                  description
                }
              }
            }
          }
        }
      `;
      variables = { id: parseInt(anilistId) };
    } else if (type === "character") {
      // Fetch specific character details
      query = `
        query ($id: Int) {
          Character(id: $id) {
            id
            name {
              full
              native
              alternative
            }
            image {
              large
            }
            description
            age
            gender
            dateOfBirth {
              year
              month
              day
            }
          }
        }
      `;
      variables = { id: parseInt(anilistId) };
    } else if (type === "staff") {
      // Fetch voice actor details
      query = `
        query ($id: Int) {
          Staff(id: $id) {
            id
            name {
              full
              native
            }
            image {
              large
            }
            language
            dateOfBirth {
              year
              month
              day
            }
            age
            gender
            description
          }
        }
      `;
      variables = { id: parseInt(anilistId) };
    }

    console.log("Fetching from AniList API...", { type, anilistId });

    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AniList API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch from AniList API" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error("AniList GraphQL errors:", data.errors);
      return new Response(
        JSON.stringify({ error: "AniList API returned errors", details: data.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data.data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-anilist-data function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
