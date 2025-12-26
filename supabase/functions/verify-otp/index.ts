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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: VerifyOtpRequest = await req.json();
    
    if (!email || !otp) {
      throw new Error("Email and OTP are required");
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the stored OTP
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (fetchError || !otpRecord) {
      console.error("OTP not found:", fetchError);
      throw new Error("OTP expired or not found. Please request a new one.");
    }

    // Check if too many attempts
    if (otpRecord.attempts >= 3) {
      // Delete the OTP record
      await supabase
        .from("otp_codes")
        .delete()
        .eq("id", otpRecord.id);
      throw new Error("Too many attempts. Please request a new OTP.");
    }

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      // Delete the OTP record
      await supabase
        .from("otp_codes")
        .delete()
        .eq("id", otpRecord.id);
      throw new Error("OTP has expired. Please request a new one.");
    }

    // Check if OTP matches
    if (otpRecord.otp_code !== otp) {
      // Increment attempts
      await supabase
        .from("otp_codes")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);
      throw new Error("Invalid OTP. Please try again.");
    }

    // OTP verified successfully - delete the record
    await supabase
      .from("otp_codes")
      .delete()
      .eq("id", otpRecord.id);
    
    console.log(`OTP verified successfully for ${email}`);

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
