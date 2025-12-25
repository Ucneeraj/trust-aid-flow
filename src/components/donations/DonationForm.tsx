import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, CreditCard, Smartphone, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DonationFormProps {
  projectId: string;
  projectTitle: string;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function DonationForm({ projectId, projectTitle, onSuccess }: DonationFormProps) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");

  const presetAmounts = [500, 1000, 2500, 5000, 10000];

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/auth?mode=signin");
      return;
    }

    if (role !== "donor") {
      toast({
        title: "Donors only",
        description: "Only donor accounts can make donations.",
        variant: "destructive",
      });
      return;
    }

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount < 1) {
      toast({
        title: "Invalid amount",
        description: "Minimum donation is ₹1.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Failed to load payment gateway");
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase.functions.invoke("create-razorpay-order", {
        body: { amount: donationAmount, projectId, projectTitle },
      });

      if (orderError) throw orderError;

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "TransFund",
        description: `Donation to ${projectTitle}`,
        order_id: orderData.orderId,
        prefill: {
          email: user.email,
        },
        config: {
          display: {
            blocks: {
              upi: { name: "Pay via UPI", instruments: [{ method: "upi" }] },
              card: { name: "Card", instruments: [{ method: "card" }] },
              netbanking: { name: "Netbanking", instruments: [{ method: "netbanking" }] },
            },
            sequence: paymentMethod === "upi" ? ["block.upi", "block.card", "block.netbanking"] 
                     : paymentMethod === "card" ? ["block.card", "block.upi", "block.netbanking"]
                     : ["block.netbanking", "block.upi", "block.card"],
            preferences: { show_default_blocks: true },
          },
        },
        handler: async function (response: any) {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                projectId,
                donorId: user.id,
                amount: donationAmount,
                message: message || null,
                isAnonymous,
                paymentMethod,
              },
            });

            if (verifyError) throw verifyError;

            toast({
              title: "Thank you!",
              description: `Your donation of ₹${donationAmount.toLocaleString()} has been received.`,
            });
            setAmount("");
            setMessage("");
            setIsAnonymous(false);
            onSuccess?.();
          } catch (error: any) {
            toast({
              title: "Payment verification failed",
              description: error.message,
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        theme: {
          color: "#10b981",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-primary" />
          Make a Donation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Quick Amount</Label>
            <div className="flex flex-wrap gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === preset.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                >
                  ₹{preset.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Custom Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="1"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
              <div className="grid grid-cols-3 gap-2">
                <div className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer ${paymentMethod === "upi" ? "border-primary bg-primary/10" : "border-border"}`}
                     onClick={() => setPaymentMethod("upi")}>
                  <Smartphone className="h-6 w-6 mb-1" />
                  <span className="text-xs font-medium">UPI</span>
                </div>
                <div className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer ${paymentMethod === "card" ? "border-primary bg-primary/10" : "border-border"}`}
                     onClick={() => setPaymentMethod("card")}>
                  <CreditCard className="h-6 w-6 mb-1" />
                  <span className="text-xs font-medium">Card</span>
                </div>
                <div className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer ${paymentMethod === "netbanking" ? "border-primary bg-primary/10" : "border-border"}`}
                     onClick={() => setPaymentMethod("netbanking")}>
                  <QrCode className="h-6 w-6 mb-1" />
                  <span className="text-xs font-medium">Netbanking</span>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Leave an encouraging message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="anonymous" className="cursor-pointer">
              Donate anonymously
            </Label>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {user ? `Donate ₹${amount || "0"}` : "Sign in to Donate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
