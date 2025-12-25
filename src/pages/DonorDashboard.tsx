import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { Heart, TrendingUp, History, Loader2, Camera, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function DonorDashboard() {
  const { user, role, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: donations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ["donor-donations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("donations")
        .select("*, projects(title, status, ngo_details(organization_name))")
        .eq("donor_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      
      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      
      if (updateError) throw updateError;
      
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile photo updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB allowed", variant: "destructive" });
      return;
    }
    
    setUploading(true);
    await uploadAvatar.mutateAsync(file);
    setUploading(false);
  };
  
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  if (role !== "donor") return <Navigate to="/" />;

  const totalDonated = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const projectsSupported = new Set(donations.map(d => d.project_id)).size;

  const getPaymentMethodBadge = (method: string | null) => {
    switch (method) {
      case "upi": return <Badge variant="secondary">UPI</Badge>;
      case "card": return <Badge variant="secondary">Card</Badge>;
      case "netbanking": return <Badge variant="secondary">Netbanking</Badge>;
      default: return <Badge variant="outline">-</Badge>;
    }
  };

  return (
    <MainLayout showFooter={false}>
      <div className="container py-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{profile?.full_name || "Donor"}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Donated</CardTitle>
              <Heart className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{totalDonated.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projects Supported</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{projectsSupported}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Donations Made</CardTitle>
              <History className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{donations.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {donationsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You haven't made any donations yet.</p>
                <Link to="/projects">
                  <Button>Browse Projects</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {donations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/projects/${donation.project_id}`} className="font-medium hover:text-primary truncate">
                          {(donation.projects as any)?.title || "Unknown Project"}
                        </Link>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {(donation.projects as any)?.ngo_details?.organization_name || "Unknown NGO"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getPaymentMethodBadge(donation.payment_method)}
                        <Badge variant={donation.payment_status === "completed" ? "default" : "secondary"}>
                          {donation.payment_status || "completed"}
                        </Badge>
                        {donation.is_anonymous && <Badge variant="outline">Anonymous</Badge>}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-primary">₹{Number(donation.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(donation.created_at), "MMM d, yyyy")}
                      </p>
                      {donation.payment_id && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {donation.payment_id.slice(0, 12)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
