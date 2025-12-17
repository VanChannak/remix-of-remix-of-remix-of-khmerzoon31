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

    // Get transaction details
    const { data: transaction, error: txError } = await supabaseClient
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('user_id', user.id)
      .single();

    if (txError || !transaction) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // In production, verify with Bakong API
    const paymentVerified = true;

    if (paymentVerified) {
      // Update transaction
      await supabaseClient
        .from('payment_transactions')
        .update({ payment_status: 'completed' })
        .eq('transaction_id', transactionId);

      // Get plan details
      const { data: plan } = await supabaseClient
        .from('subscription_plans')
        .select('duration_days')
        .eq('id', transaction.reference_id)
        .single();

      if (plan) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration_days);

        // Create or update subscription
        const { error: subError } = await supabaseClient
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            plan_id: transaction.reference_id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            is_active: true,
            payment_status: 'completed',
          });

        if (subError) {
          console.error('Subscription creation error:', subError);
        }
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
