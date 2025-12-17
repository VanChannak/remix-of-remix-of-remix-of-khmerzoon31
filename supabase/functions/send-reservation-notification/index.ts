import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReservationNotificationRequest {
  releaseId: string;
  releaseTitle: string;
  releaseType: string;
}

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

    const { releaseId, releaseTitle, releaseType }: ReservationNotificationRequest = await req.json();

    console.log("Sending notification for release:", { releaseId, releaseTitle, releaseType });

    // Get all users who reserved this release
    const { data: reservations, error: reservationsError } = await supabaseClient
      .from("reservations")
      .select(`
        user_id,
        profiles:user_id (email)
      `)
      .eq("release_id", releaseId)
      .eq("notified", false);

    if (reservationsError) {
      console.error("Error fetching reservations:", reservationsError);
      throw reservationsError;
    }

    if (!reservations || reservations.length === 0) {
      console.log("No reservations found for this release");
      return new Response(
        JSON.stringify({ message: "No reservations to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${reservations.length} reservations to notify`);

    // Send emails to all reserved users
    const emailPromises = reservations.map(async (reservation: any) => {
      const userEmail = reservation.profiles?.email;
      
      if (!userEmail) {
        console.warn(`No email found for user ${reservation.user_id}`);
        return null;
      }

      try {
        const emailResponse = await resend.emails.send({
          from: "KHMERZOON <onboarding@resend.dev>",
          to: [userEmail],
          subject: `${releaseTitle} is Now Available!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                Great News! 🎉
              </h1>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                The ${releaseType} you reserved, <strong>${releaseTitle}</strong>, is now available to watch!
              </p>
              <div style="margin: 30px 0;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://khmerzoon.lovable.app'}/coming-soon" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Watch Now
                </a>
              </div>
              <p style="font-size: 14px; color: #888; margin-top: 30px;">
                Thank you for using KHMERZOON!<br>
                <em>Your entertainment destination</em>
              </p>
            </div>
          `,
        });

        console.log(`Email sent successfully to ${userEmail}:`, emailResponse);
        return { userId: reservation.user_id, success: true };
      } catch (emailError) {
        console.error(`Error sending email to ${userEmail}:`, emailError);
        return { userId: reservation.user_id, success: false, error: emailError };
      }
    });

    const results = await Promise.all(emailPromises);
    const successfulEmails = results.filter(r => r?.success);

    // Mark all reservations as notified
    if (successfulEmails.length > 0) {
      const { error: updateError } = await supabaseClient
        .from("reservations")
        .update({ notified: true })
        .eq("release_id", releaseId);

      if (updateError) {
        console.error("Error updating notification status:", updateError);
      } else {
        console.log(`Marked ${successfulEmails.length} reservations as notified`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Notifications sent",
        total: reservations.length,
        successful: successfulEmails.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reservation-notification function:", error);
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
