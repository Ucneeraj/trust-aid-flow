import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, TrendingUp, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Projects() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, ngo_details(*)")
        .in("status", ["active", "completed"])
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Browse Projects</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover verified NGO projects and see exactly how your donation will be used.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const progress = project.funding_goal > 0 
                ? Math.min((Number(project.current_funding) / Number(project.funding_goal)) * 100, 100)
                : 0;
              
              return (
                <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Heart className="h-16 w-16 text-primary/30" />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="px-2 py-1 rounded-full bg-secondary">{project.category || "General"}</span>
                      <span className={`px-2 py-1 rounded-full ${project.status === "active" ? "bg-success/20 text-success" : "bg-muted"}`}>
                        {project.status}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      by {(project.ngo_details as any)?.organization_name || "NGO"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description || "No description available."}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Raised</span>
                        <span className="font-semibold">${Number(project.current_funding).toLocaleString()} / ${Number(project.funding_goal).toLocaleString()}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <Button asChild className="w-full">
                      <Link to={`/projects/${project.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">Be the first NGO to create a project!</p>
              <Button asChild>
                <Link to="/auth?mode=signup&role=ngo">Register as NGO</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
