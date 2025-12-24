import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DonationFormProps {
  projectId: string;
  projectTitle: string;
  onSuccess?: () => void;
}

export function DonationForm({ projectId, projectTitle, onSuccess }: DonationFormProps) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const presetAmounts = [25, 50, 100, 250, 500];

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
    if (isNaN(donationAmount) || donationAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("donations").insert({
      project_id: projectId,
      donor_id: user.id,
      amount: donationAmount,
      message: message || null,
      is_anonymous: isAnonymous,
    });

    if (error) {
      toast({
        title: "Donation failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Thank you!",
        description: `Your donation of $${donationAmount.toLocaleString()} has been recorded.`,
      });
      setAmount("");
      setMessage("");
      setIsAnonymous(false);
      onSuccess?.();
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
                  ${preset}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Custom Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
              required
            />
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
            {user ? `Donate $${amount || "0"}` : "Sign in to Donate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
