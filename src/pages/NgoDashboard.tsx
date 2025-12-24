import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Navigate, Link } from "react-router-dom";
import { FolderOpen, DollarSign, Receipt, Clock, CheckCircle, Loader2, Eye, Play, Pause } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NgoRegistrationForm } from "@/components/ngo/NgoRegistrationForm";
import { CreateProjectForm } from "@/components/ngo/CreateProjectForm";
import { AddExpenseForm } from "@/components/ngo/AddExpenseForm";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function NgoDashboard() {
  const { user, role, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: ngoDetails, isLoading: ngoLoading, refetch: refetchNgo } = useQuery({
    queryKey: ["ngo-details", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ngo_details")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ["ngo-projects", ngoDetails?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("ngo_id", ngoDetails!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!ngoDetails?.id,
  });

  const updateProjectStatus = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: "draft" | "active" | "completed" | "paused" }) => {
      const { error } = await supabase
        .from("projects")
        .update({ status })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ngo-projects"] });
      toast({ title: "Project status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  if (role !== "ngo") return <Navigate to="/" />;

  if (ngoLoading) {
    return (
      <MainLayout showFooter={false}>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Show registration form if NGO not registered
  if (!ngoDetails) {
    return (
      <MainLayout showFooter={false}>
        <div className="container py-8 max-w-2xl">
          <NgoRegistrationForm onSuccess={refetchNgo} />
        </div>
      </MainLayout>
    );
  }

  // Show pending status
  if (ngoDetails.status === "pending") {
    return (
      <MainLayout showFooter={false}>
        <div className="container py-16 text-center max-w-lg mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 mx-auto mb-6">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Pending Approval</h1>
          <p className="text-muted-foreground">
            Your NGO registration for <strong>{ngoDetails.organization_name}</strong> is under review. 
            You'll be notified once approved.
          </p>
        </div>
      </MainLayout>
    );
  }

  // Show rejected status
  if (ngoDetails.status === "rejected") {
    return (
      <MainLayout showFooter={false}>
        <div className="container py-16 text-center max-w-lg mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-6">
            <Clock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Registration Rejected</h1>
          <p className="text-muted-foreground">
            Unfortunately, your NGO registration was not approved. Please contact support for more information.
          </p>
        </div>
      </MainLayout>
    );
  }

  const totalReceived = projects.reduce((sum, p) => sum + Number(p.current_funding), 0);
  const totalSpent = projects.reduce((sum, p) => sum + Number(p.total_spent), 0);
  const activeProjects = projects.filter(p => p.status === "active").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <MainLayout showFooter={false}>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{ngoDetails.organization_name}</h1>
            <p className="text-muted-foreground">NGO Dashboard</p>
          </div>
          <CreateProjectForm ngoId={ngoDetails.id} onSuccess={refetchProjects} />
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalReceived.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeProjects}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
              <Receipt className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Your Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : projects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No projects yet. Create your first project to start receiving donations.
              </p>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/20">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{project.title}</h3>
                        <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${Number(project.current_funding).toLocaleString()} raised of ${Number(project.funding_goal).toLocaleString()} • 
                        ${Number(project.total_spent).toLocaleString()} spent
                      </p>
                      {project.created_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <AddExpenseForm projectId={project.id} onSuccess={refetchProjects} />
                      {project.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => updateProjectStatus.mutate({ projectId: project.id, status: 'active' })}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Activate
                        </Button>
                      )}
                      {project.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateProjectStatus.mutate({ projectId: project.id, status: 'paused' })}
                        >
                          <Pause className="mr-1 h-3 w-3" />
                          Pause
                        </Button>
                      )}
                      {project.status === 'paused' && (
                        <Button
                          size="sm"
                          onClick={() => updateProjectStatus.mutate({ projectId: project.id, status: 'active' })}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Resume
                        </Button>
                      )}
                      <Link to={`/projects/${project.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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
