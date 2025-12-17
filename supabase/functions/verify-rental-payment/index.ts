import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { transactionId } = await req.json();

    // In production, verify with Bakong API
    // For now, simulate successful payment
    const paymentVerified = true;

    if (paymentVerified) {
      // Update transaction status
      const { error: txError } = await supabaseClient
        .from('payment_transactions')
        .update({ payment_status: 'completed' })
        .eq('transaction_id', transactionId)
        .eq('user_id', user.id);

      if (txError) {
        console.error('Transaction update error:', txError);
      }

      // Update rental status and set start date
      const { error: rentalError } = await supabaseClient
        .from('user_rentals')
        .update({
          payment_status: 'completed',
          start_date: new Date().toISOString(),
        })
        .eq('transaction_id', transactionId)
        .eq('user_id', user.id);

      if (rentalError) {
        console.error('Rental update error:', rentalError);
        return new Response(JSON.stringify({ error: 'Failed to update rental' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ success: true, status: 'completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, status: 'pending' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
