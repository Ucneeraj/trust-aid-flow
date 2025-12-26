import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OtpRequest {
  email: string;
  type: "signup" | "signin";
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type }: OtpRequest = await req.json();
    
    if (!email) {
      throw new Error("Email is required");
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await supabase
      .from("otp_codes")
      .delete()
      .eq("email", email.toLowerCase());

    // Store new OTP in database
    const { error: insertError } = await supabase
      .from("otp_codes")
      .insert({
        email: email.toLowerCase(),
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      throw new Error("Failed to generate OTP");
    }

    console.log(`OTP generated for ${email}: ${otp}`);

    // In production, integrate with Resend or similar email service
    // For now, we return the OTP in response for testing
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent to your email",
        // Remove this in production - only for testing
        _debug_otp: otp 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
