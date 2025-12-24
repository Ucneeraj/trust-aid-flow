import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User } from "lucide-react";
import { format } from "date-fns";

interface Donation {
  id: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
  profiles: null | {
    full_name: string | null;
  } | null;
}

interface DonorListProps {
  donations: Donation[];
  totalRaised: number;
}

export function DonorList({ donations, totalRaised }: DonorListProps) {
  if (donations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Donors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Be the first to donate to this project!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Donors ({donations.length})
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            ${totalRaised.toLocaleString()} raised
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {donations.slice(0, 10).map((donation) => (
            <div key={donation.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground truncate">
                    {donation.is_anonymous 
                      ? 'Anonymous Donor' 
                      : donation.profiles?.full_name || 'Anonymous'}
                  </p>
                  <p className="font-semibold text-success shrink-0">${Number(donation.amount).toLocaleString()}</p>
                </div>
                {donation.message && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{donation.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(donation.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
          {donations.length > 10 && (
            <p className="text-center text-sm text-muted-foreground pt-2">
              +{donations.length - 10} more donors
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
