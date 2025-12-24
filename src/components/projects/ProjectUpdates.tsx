import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface ProjectUpdatesProps {
  updates: ProjectUpdate[];
}

export function ProjectUpdates({ updates }: ProjectUpdatesProps) {
  if (updates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            Project Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No updates have been posted yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          Project Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {updates.map((update) => (
            <article key={update.id} className="border-b border-border/50 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Calendar className="h-3 w-3" />
                {format(new Date(update.created_at), 'MMMM d, yyyy')}
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">{update.title}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{update.content}</p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
