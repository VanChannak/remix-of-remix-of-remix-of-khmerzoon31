import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RentalPaymentRequest {
  mediaId: string;
  mediaType: 'movie' | 'series' | 'anime';
  rentalPrice: number;
  rentalPeriodDays: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { mediaId, mediaType, rentalPrice, rentalPeriodDays }: RentalPaymentRequest = await req.json();

    // Generate transaction ID
    const transactionId = `RENT-${Date.now()}-${user.id.substring(0, 8)}`;

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'rental',
        amount: rentalPrice,
        currency: 'USD',
        payment_method: 'bakong_khqr',
        payment_status: 'pending',
        transaction_id: transactionId,
        reference_id: mediaId,
        reference_type: mediaType,
        khqr_data: {
          qr_string: `KHQR:${transactionId}:${rentalPrice}`,
          merchant_id: 'MERCHANT_ID',
          amount: rentalPrice,
        },
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction creation error:', transactionError);
      return new Response(JSON.stringify({ error: 'Failed to create transaction' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create rental record
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + rentalPeriodDays);

    const { error: rentalError } = await supabaseClient
      .from('user_rentals')
      .insert({
        user_id: user.id,
        media_id: mediaId,
        media_type: mediaType,
        rental_price: rentalPrice,
        payment_status: 'pending',
        payment_method: 'bakong_khqr',
        transaction_id: transactionId,
        end_date: endDate.toISOString(),
      });

    if (rentalError) {
      console.error('Rental creation error:', rentalError);
      return new Response(JSON.stringify({ error: 'Failed to create rental' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        qrData: transaction.khqr_data,
        expiresAt: endDate.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
