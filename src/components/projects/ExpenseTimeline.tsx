import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Expense {
  id: string;
  amount: number;
  description: string;
  expense_date: string;
  vendor_name: string | null;
  receipt_url: string | null;
  created_at: string;
  expense_categories: {
    name: string;
    icon: string | null;
  } | null;
}

interface ExpenseTimelineProps {
  expenses: Expense[];
  totalSpent: number;
}

export function ExpenseTimeline({ expenses, totalSpent }: ExpenseTimelineProps) {
  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Spending Transparency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No expenses have been recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Spending Transparency
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            Total: ${totalSpent.toLocaleString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-foreground">{expense.description}</h4>
                    <p className="text-sm text-muted-foreground">
                      {expense.expense_categories?.name || 'Uncategorized'}
                      {expense.vendor_name && ` • ${expense.vendor_name}`}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground shrink-0">${Number(expense.amount).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{format(new Date(expense.expense_date), 'MMM d, yyyy')}</span>
                  {expense.receipt_url && (
                    <a
                      href={expense.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      View Receipt <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
