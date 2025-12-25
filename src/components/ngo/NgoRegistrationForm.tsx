import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Instagram, Facebook, Twitter, Linkedin } from "lucide-react";

interface NgoRegistrationFormProps {
  onSuccess?: () => void;
}

export function NgoRegistrationForm({ onSuccess }: NgoRegistrationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: "",
    registration_number: "",
    description: "",
    website: "",
    address: "",
    instagram_url: "",
    facebook_url: "",
    twitter_url: "",
    linkedin_url: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("ngo_details").insert({
      user_id: user.id,
      organization_name: formData.organization_name,
      registration_number: formData.registration_number || null,
      description: formData.description || null,
      website: formData.website || null,
      address: formData.address || null,
      instagram_url: formData.instagram_url || null,
      facebook_url: formData.facebook_url || null,
      twitter_url: formData.twitter_url || null,
      linkedin_url: formData.linkedin_url || null,
      status: "pending",
    });

    if (error) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registration submitted!",
        description: "Your NGO is pending admin approval. You'll be notified when approved.",
      });
      onSuccess?.();
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Register Your NGO</CardTitle>
            <CardDescription>Complete your organization profile to start receiving donations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organization_name">Organization Name *</Label>
            <Input
              id="organization_name"
              name="organization_name"
              placeholder="e.g., Hope Foundation"
              value={formData.organization_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registration_number">Registration Number</Label>
            <Input
              id="registration_number"
              name="registration_number"
              placeholder="e.g., NGO-12345"
              value={formData.registration_number}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">About Your Organization *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your mission, activities, and impact..."
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://yourorg.org"
                value={formData.website}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="City, Country"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Social Media Links</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram_url" className="flex items-center gap-2 text-sm">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  Instagram
                </Label>
                <Input
                  id="instagram_url"
                  name="instagram_url"
                  type="url"
                  placeholder="https://instagram.com/yourorg"
                  value={formData.instagram_url}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook_url" className="flex items-center gap-2 text-sm">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Facebook
                </Label>
                <Input
                  id="facebook_url"
                  name="facebook_url"
                  type="url"
                  placeholder="https://facebook.com/yourorg"
                  value={formData.facebook_url}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_url" className="flex items-center gap-2 text-sm">
                  <Twitter className="h-4 w-4 text-sky-500" />
                  X (Twitter)
                </Label>
                <Input
                  id="twitter_url"
                  name="twitter_url"
                  type="url"
                  placeholder="https://x.com/yourorg"
                  value={formData.twitter_url}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url" className="flex items-center gap-2 text-sm">
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/company/yourorg"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit for Approval
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
