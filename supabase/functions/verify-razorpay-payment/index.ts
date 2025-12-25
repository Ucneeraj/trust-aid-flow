import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  projectId: string;
  donorId: string;
  amount: number;
  message?: string;
  isAnonymous: boolean;
  paymentMethod: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      projectId,
      donorId,
      amount,
      message,
      isAnonymous,
      paymentMethod,
    }: VerifyRequest = await req.json();

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    if (!keySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature mismatch");
      throw new Error("Payment verification failed - invalid signature");
    }

    console.log("Payment verified successfully:", razorpay_payment_id);

    // Save donation to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabaseClient.from("donations").insert({
      project_id: projectId,
      donor_id: donorId,
      amount: amount,
      message: message || null,
      is_anonymous: isAnonymous,
      payment_method: paymentMethod,
      payment_id: razorpay_payment_id,
      payment_status: "completed",
    }).select().single();

    if (error) {
      console.error("Error saving donation:", error);
      throw new Error("Failed to save donation");
    }

    console.log("Donation saved:", data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        donationId: data.id,
        message: "Payment verified and donation recorded"
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
