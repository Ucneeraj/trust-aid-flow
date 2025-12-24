import { MainLayout } from "@/components/layout/MainLayout";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Heart, Building, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DonationForm } from "@/components/donations/DonationForm";
import { MilestoneTimeline } from "@/components/projects/MilestoneTimeline";
import { ExpenseTimeline } from "@/components/projects/ExpenseTimeline";
import { DonorList } from "@/components/projects/DonorList";
import { ProjectUpdates } from "@/components/projects/ProjectUpdates";

export default function ProjectDetail() {
  const { id } = useParams();
  
  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, ngo_details(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["milestones", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .eq("project_id", id!)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, expense_categories(*)")
        .eq("project_id", id!)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: donations = [], refetch: refetchDonations } = useQuery({
    queryKey: ["donations", id],
    queryFn: async () => {
      const { data: donationsData, error } = await supabase
        .from("donations")
        .select("*")
        .eq("project_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch profiles for non-anonymous donations
      const donorIds = donationsData
        .filter(d => !d.is_anonymous)
        .map(d => d.donor_id);
      
      let profilesMap: Record<string, { full_name: string | null }> = {};
      if (donorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", donorIds);
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = { full_name: p.full_name };
          return acc;
        }, {} as Record<string, { full_name: string | null }>);
      }
      
      return donationsData.map(d => ({
        ...d,
        profiles: profilesMap[d.donor_id] || null,
      }));
    },
    enabled: !!id,
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["project-updates", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_updates")
        .select("*")
        .eq("project_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleDonationSuccess = () => {
    refetch();
    refetchDonations();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-bold">Project not found</h1>
        </div>
      </MainLayout>
    );
  }

  const progress = project.funding_goal > 0 
    ? Math.min((Number(project.current_funding) / Number(project.funding_goal)) * 100, 100)
    : 0;

  const ngoDetails = project.ngo_details as { organization_name?: string } | null;

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="h-64 md:h-80 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
              {project.image_url ? (
                <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
              ) : (
                <Heart className="h-24 w-24 text-primary/30" />
              )}
            </div>

            {/* Title & NGO Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {project.category && (
                  <Badge variant="secondary">{project.category}</Badge>
                )}
                <Badge variant={project.status === 'active' ? 'default' : 'outline'}>
                  {project.status}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {ngoDetails?.organization_name || "NGO"}
                </span>
                {project.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Started {format(new Date(project.start_date), 'MMM yyyy')}
                  </span>
                )}
              </div>
            </div>

            {/* Tabs for content */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="spending">Spending</TabsTrigger>
                <TabsTrigger value="donors">Donors</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About this project</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {project.description || "No description available."}
                    </p>
                  </CardContent>
                </Card>
                <MilestoneTimeline milestones={milestones} />
              </TabsContent>

              <TabsContent value="updates" className="mt-6">
                <ProjectUpdates updates={updates} />
              </TabsContent>

              <TabsContent value="spending" className="mt-6">
                <ExpenseTimeline expenses={expenses} totalSpent={Number(project.total_spent)} />
              </TabsContent>

              <TabsContent value="donors" className="mt-6">
                <DonorList donations={donations} totalRaised={Number(project.current_funding)} />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Funding Progress */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">${Number(project.current_funding).toLocaleString()}</p>
                  <p className="text-muted-foreground">raised of ${Number(project.funding_goal).toLocaleString()} goal</p>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-center text-sm text-muted-foreground">{progress.toFixed(0)}% funded</p>
                <div className="grid grid-cols-2 gap-4 text-center pt-4 border-t border-border">
                  <div>
                    <p className="text-xl font-semibold text-foreground">${Number(project.total_spent).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Spent</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-success">${(Number(project.current_funding) - Number(project.total_spent)).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Donation Form */}
            {project.status === 'active' && (
              <DonationForm
                projectId={project.id}
                projectTitle={project.title}
                onSuccess={handleDonationSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
