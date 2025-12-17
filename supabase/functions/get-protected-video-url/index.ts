import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized: Missing authorization header');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: Invalid user');
    }

    const { 
      sourceId, // video source id
      episodeId, // for series/anime
      movieId, // for movies
      mediaId, // media id for rental check
      mediaType, // 'movie' | 'series' | 'anime'
      accessType, // 'free' | 'rent' | 'vip'
      excludeFromPlan 
    } = await req.json();

    if (!sourceId) {
      throw new Error('Source ID is required');
    }

    console.log('Validating access for user:', user.id, 'source:', sourceId);

    // If content is free, allow access
    if (accessType === 'free') {
      console.log('Free content - allowing access');
    } else {
      // Check subscription status
      let hasActiveSubscription = false;
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('payment_status', 'completed')
        .gte('end_date', new Date().toISOString())
        .maybeSingle();

      hasActiveSubscription = !!subscription;
      console.log('Has active subscription:', hasActiveSubscription);

      // Check rental status
      let hasActiveRental = false;
      if (mediaId && mediaType) {
        const { data: rental } = await supabase
          .from('user_rentals')
          .select('*')
          .eq('user_id', user.id)
          .eq('media_id', mediaId)
          .eq('media_type', mediaType)
          .eq('payment_status', 'completed')
          .gte('end_date', new Date().toISOString())
          .maybeSingle();

        hasActiveRental = !!rental;
        console.log('Has active rental:', hasActiveRental);
      }

      // Validate access based on access type
      if (accessType === 'rent' && excludeFromPlan) {
        // Rent with exclude: everyone needs to pay (unless they have active rental)
        if (!hasActiveRental) {
          throw new Error('ACCESS_DENIED: Rental required for this content');
        }
      } else if (accessType === 'rent' && !excludeFromPlan) {
        // Rent without exclude: VIP members or rental holders can access
        if (!hasActiveSubscription && !hasActiveRental) {
          throw new Error('ACCESS_DENIED: Subscription or rental required');
        }
      } else if (accessType === 'vip') {
        // VIP content: only VIP members can watch
        if (!hasActiveSubscription) {
          throw new Error('ACCESS_DENIED: VIP subscription required');
        }
      }
    }

    // User has access - get the video source
    const { data: videoSource, error: sourceError } = await supabase
      .from('video_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !videoSource) {
      throw new Error('Video source not found');
    }

    console.log('Access granted - returning video source');

    // Return the video source with a token that expires
    const accessToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    return new Response(
      JSON.stringify({
        success: true,
        source: {
          id: videoSource.id,
          url: videoSource.url,
          quality_urls: videoSource.quality_urls,
          source_type: videoSource.source_type,
          server_name: videoSource.server_name,
          quality: videoSource.quality,
          is_default: videoSource.is_default,
        },
        accessToken,
        expiresAt: expiresAt.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isAccessDenied = message.startsWith('ACCESS_DENIED');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        code: isAccessDenied ? 'ACCESS_DENIED' : 'ERROR',
      }),
      {
        status: isAccessDenied ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
