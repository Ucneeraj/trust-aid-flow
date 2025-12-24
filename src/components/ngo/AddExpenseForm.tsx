import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Receipt } from "lucide-react";

interface AddExpenseFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export function AddExpenseForm({ projectId, onSuccess }: AddExpenseFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category_id: "",
    expense_date: new Date().toISOString().split('T')[0],
    vendor_name: "",
    receipt_url: "",
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("expenses").insert({
      project_id: projectId,
      created_by: user.id,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id,
      expense_date: formData.expense_date,
      vendor_name: formData.vendor_name || null,
      receipt_url: formData.receipt_url || null,
    });

    if (error) {
      toast({
        title: "Failed to add expense",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Expense recorded",
        description: "The expense has been added to the transparency timeline.",
      });
      setFormData({
        description: "",
        amount: "",
        category_id: "",
        expense_date: new Date().toISOString().split('T')[0],
        vendor_name: "",
        receipt_url: "",
      });
      setOpen(false);
      onSuccess?.();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Receipt className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
          <DialogDescription>
            Add an expense to this project. Once added, it cannot be edited or deleted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What was this expense for?"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Category *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_date">Date *</Label>
              <Input
                id="expense_date"
                name="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor_name">Vendor/Supplier</Label>
              <Input
                id="vendor_name"
                name="vendor_name"
                placeholder="e.g., ABC Supplies"
                value={formData.vendor_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_url">Receipt URL (optional)</Label>
            <Input
              id="receipt_url"
              name="receipt_url"
              type="url"
              placeholder="https://..."
              value={formData.receipt_url}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
