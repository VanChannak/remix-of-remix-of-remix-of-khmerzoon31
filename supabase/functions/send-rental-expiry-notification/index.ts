import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Checking for expiring rentals...");

    // Get rentals expiring within the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: expiringRentals, error: rentalsError } = await supabaseClient
      .from("user_rentals")
      .select(`
        id,
        user_id,
        media_id,
        media_type,
        end_date,
        rental_price
      `)
      .eq("payment_status", "completed")
      .gte("end_date", now.toISOString())
      .lte("end_date", tomorrow.toISOString());

    if (rentalsError) {
      console.error("Error fetching expiring rentals:", rentalsError);
      throw rentalsError;
    }

    if (!expiringRentals || expiringRentals.length === 0) {
      console.log("No rentals expiring within 24 hours");
      return new Response(
        JSON.stringify({ message: "No expiring rentals", count: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${expiringRentals.length} expiring rentals`);

    // Process each expiring rental
    const emailResults = await Promise.all(
      expiringRentals.map(async (rental) => {
        try {
          // Get user email
          const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("email, display_name")
            .eq("id", rental.user_id)
            .single();

          if (profileError || !profile?.email) {
            console.warn(`No email found for user ${rental.user_id}`);
            return { rentalId: rental.id, success: false, error: "No email" };
          }

          // Get media title
          let mediaTitle = "Unknown Content";
          const table = rental.media_type === "movie" 
            ? "movies" 
            : rental.media_type === "series" 
              ? "series" 
              : "animes";
          
          const { data: media } = await supabaseClient
            .from(table)
            .select("title")
            .eq("id", rental.media_id)
            .single();

          if (media?.title) {
            mediaTitle = media.title;
          }

          // Calculate hours remaining
          const endDate = new Date(rental.end_date);
          const hoursRemaining = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60)));

          // Send email notification
          const emailResponse = await resend.emails.send({
            from: "KHMERZOON <onboarding@resend.dev>",
            to: [profile.email],
            subject: `Your rental of "${mediaTitle}" expires soon!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #e74c3c; margin-bottom: 20px;">
                  ⏰ Rental Expiring Soon!
                </h1>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                  Hi ${profile.display_name || 'there'},
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                  Your rental of <strong>${mediaTitle}</strong> will expire in approximately <strong>${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}</strong>.
                </p>
                
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0; color: #555;">
                    <strong>Rental Details:</strong><br>
                    📺 Title: ${mediaTitle}<br>
                    📅 Expires: ${endDate.toLocaleString()}<br>
                    💰 Rental Price: $${rental.rental_price.toFixed(2)}
                  </p>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                  Make sure to finish watching before your rental expires! You can always rent it again if you need more time.
                </p>
                
                <div style="margin: 30px 0;">
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://khmerzoon.lovable.app'}" 
                     style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Watch Now
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                  Thank you for using KHMERZOON!<br>
                  <em>Your entertainment destination</em>
                </p>
              </div>
            `,
          });

          console.log(`Email sent to ${profile.email} for rental ${rental.id}:`, emailResponse);
          return { rentalId: rental.id, success: true, email: profile.email };
        } catch (error) {
          console.error(`Error processing rental ${rental.id}:`, error);
          return { rentalId: rental.id, success: false, error: String(error) };
        }
      })
    );

    const successCount = emailResults.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        message: "Rental expiry notifications processed",
        total: expiringRentals.length,
        successful: successCount,
        results: emailResults,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-rental-expiry-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
