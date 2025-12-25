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

// Simple in-memory OTP storage (in production, use a proper cache like Redis)
const otpStore = new Map<string, { otp: string; expiry: number; attempts: number }>();

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

    const otp = generateOTP();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email.toLowerCase(), { otp, expiry, attempts: 0 });

    // For demo purposes, log the OTP (in production, send via email service like Resend)
    console.log(`OTP for ${email}: ${otp}`);

    // In production, integrate with Resend or similar email service
    // For now, we'll just return success and log the OTP
    
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

// Export for verification function
export { otpStore };
