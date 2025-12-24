import { MainLayout } from "@/components/layout/MainLayout";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ProjectDetail() {
  const { id } = useParams();
  
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, ngo_details(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

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

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Heart className="h-24 w-24 text-primary/30" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              <p className="text-muted-foreground">
                by {(project.ngo_details as any)?.organization_name || "NGO"}
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>About this project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{project.description || "No description available."}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">${Number(project.current_funding).toLocaleString()}</p>
                  <p className="text-muted-foreground">raised of ${Number(project.funding_goal).toLocaleString()} goal</p>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center pt-4">
                  <div>
                    <p className="text-xl font-semibold text-foreground">${Number(project.total_spent).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-success">${(Number(project.current_funding) - Number(project.total_spent)).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
