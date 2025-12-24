import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { Navigate, Link } from "react-router-dom";
import { Users, Building, FolderOpen, DollarSign, Loader2, Check, X, Eye, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user, role, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, ngos, projects, donations] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("ngo_details").select("id, status"),
        supabase.from("projects").select("id, status"),
        supabase.from("donations").select("amount"),
      ]);
      
      const ngoList = ngos.data || [];
      const projectList = projects.data || [];
      const donationList = donations.data || [];

      return {
        totalUsers: profiles.count || 0,
        pendingNgos: ngoList.filter(n => n.status === "pending").length,
        approvedNgos: ngoList.filter(n => n.status === "approved").length,
        activeProjects: projectList.filter(p => p.status === "active").length,
        totalDonations: donationList.reduce((sum, d) => sum + Number(d.amount), 0),
      };
    },
  });

  const { data: pendingNgos = [], isLoading: ngosLoading } = useQuery({
    queryKey: ["pending-ngos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ngo_details")
        .select("*, profiles(full_name, email)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allNgos = [] } = useQuery({
    queryKey: ["all-ngos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ngo_details")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ["all-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, ngo_details(organization_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateNgoStatus = useMutation({
    mutationFn: async ({ ngoId, status }: { ngoId: string; status: "pending" | "approved" | "rejected" | "suspended" }) => {
      const { error } = await supabase
        .from("ngo_details")
        .update({ 
          status, 
          approved_at: status === "approved" ? new Date().toISOString() : null,
          approved_by: status === "approved" ? user?.id : null,
        })
        .eq("id", ngoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-ngos"] });
      queryClient.invalidateQueries({ queryKey: ["all-ngos"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "NGO status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });
  
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  if (role !== "admin") return <Navigate to="/" />;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <MainLayout showFooter={false}>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending NGOs</CardTitle>
              <Building className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.pendingNgos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved NGOs</CardTitle>
              <Building className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.approvedNgos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statsLoading ? "—" : stats?.activeProjects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${statsLoading ? "—" : stats?.totalDonations.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Pending Approvals ({pendingNgos.length})</TabsTrigger>
            <TabsTrigger value="ngos">All NGOs</TabsTrigger>
            <TabsTrigger value="projects">All Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending NGO Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {ngosLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : pendingNgos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No pending NGO applications.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingNgos.map((ngo) => (
                      <div key={ngo.id} className="p-4 rounded-lg border border-border bg-secondary/20">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{ngo.organization_name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Registered by: {(ngo.profiles as any)?.full_name || (ngo.profiles as any)?.email || "Unknown"}
                            </p>
                            {ngo.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ngo.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {ngo.registration_number && <span>Reg: {ngo.registration_number}</span>}
                              {ngo.website && (
                                <a href={ngo.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                  Website <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {ngo.address && <span>• {ngo.address}</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Applied {format(new Date(ngo.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateNgoStatus.mutate({ ngoId: ngo.id, status: "approved" })}
                              disabled={updateNgoStatus.isPending}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateNgoStatus.mutate({ ngoId: ngo.id, status: "rejected" })}
                              disabled={updateNgoStatus.isPending}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ngos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All NGOs</CardTitle>
              </CardHeader>
              <CardContent>
                {allNgos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No NGOs registered yet.</p>
                ) : (
                  <div className="space-y-3">
                    {allNgos.map((ngo) => (
                      <div key={ngo.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{ngo.organization_name}</h3>
                            <Badge variant={getStatusColor(ngo.status)}>{ngo.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {(ngo.profiles as any)?.email} • {format(new Date(ngo.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        {ngo.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateNgoStatus.mutate({ ngoId: ngo.id, status: "suspended" })}
                          >
                            Suspend
                          </Button>
                        )}
                        {ngo.status === "suspended" && (
                          <Button
                            size="sm"
                            onClick={() => updateNgoStatus.mutate({ ngoId: ngo.id, status: "approved" })}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {allProjects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No projects created yet.</p>
                ) : (
                  <div className="space-y-3">
                    {allProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{project.title}</h3>
                            <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {(project.ngo_details as any)?.organization_name} • 
                            ${Number(project.current_funding).toLocaleString()} / ${Number(project.funding_goal).toLocaleString()}
                          </p>
                        </div>
                        <Link to={`/projects/${project.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
