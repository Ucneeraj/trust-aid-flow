import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Target } from "lucide-react";
import { format } from "date-fns";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  target_date: string | null;
  order_index: number;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Project Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No milestones have been set for this project yet.</p>
        </CardContent>
      </Card>
    );
  }

  const sortedMilestones = [...milestones].sort((a, b) => a.order_index - b.order_index);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Project Milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {sortedMilestones.map((milestone, index) => (
              <div key={milestone.id} className="relative pl-10">
                <div className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full ${
                  milestone.is_completed ? 'bg-success text-success-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  {milestone.is_completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{milestone.title}</h4>
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {milestone.is_completed && milestone.completed_at
                      ? `Completed ${format(new Date(milestone.completed_at), 'MMM d, yyyy')}`
                      : milestone.target_date
                      ? `Target: ${format(new Date(milestone.target_date), 'MMM d, yyyy')}`
                      : 'No target date'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
