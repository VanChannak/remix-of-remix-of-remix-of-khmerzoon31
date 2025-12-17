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
      // Update transaction status
      await supabaseClient
        .from('payment_transactions')
        .update({ payment_status: 'completed' })
        .eq('transaction_id', transactionId);

      // Get or create wallet
      const { data: wallet, error: walletError } = await supabaseClient
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError) {
        console.error('Wallet fetch error:', walletError);
        return new Response(JSON.stringify({ error: 'Wallet not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = parseFloat(balanceBefore) + parseFloat(transaction.amount);

      // Update wallet balance
      const { error: updateError } = await supabaseClient
        .from('user_wallets')
        .update({ balance: balanceAfter })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Wallet update error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update wallet' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Record transaction
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          transaction_type: 'topup',
          amount: transaction.amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Wallet top-up via KHQR`,
          payment_transaction_id: transaction.id,
          reference_type: 'topup',
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'completed',
          newBalance: balanceAfter 
        }),
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