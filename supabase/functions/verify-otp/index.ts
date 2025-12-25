import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

// Shared OTP storage (in production, use Redis or similar)
const otpStore = new Map<string, { otp: string; expiry: number; attempts: number }>();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: VerifyOtpRequest = await req.json();
    
    if (!email || !otp) {
      throw new Error("Email and OTP are required");
    }

    const stored = otpStore.get(email.toLowerCase());
    
    if (!stored) {
      throw new Error("OTP expired or not found. Please request a new one.");
    }

    if (stored.attempts >= 3) {
      otpStore.delete(email.toLowerCase());
      throw new Error("Too many attempts. Please request a new OTP.");
    }

    if (Date.now() > stored.expiry) {
      otpStore.delete(email.toLowerCase());
      throw new Error("OTP has expired. Please request a new one.");
    }

    if (stored.otp !== otp) {
      stored.attempts += 1;
      otpStore.set(email.toLowerCase(), stored);
      throw new Error("Invalid OTP. Please try again.");
    }

    // OTP verified successfully
    otpStore.delete(email.toLowerCase());
    
    console.log(`OTP verified for ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully",
        verified: true
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return new Response(
      JSON.stringify({ error: error.message, verified: false }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
