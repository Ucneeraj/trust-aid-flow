export type UserRole = "donor" | "ngo" | "admin";
export type NgoStatus = "pending" | "approved" | "rejected" | "suspended";
export type ProjectStatus = "draft" | "active" | "completed" | "paused";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface NgoDetails {
  id: string;
  user_id: string;
  organization_name: string;
  registration_number: string | null;
  description: string | null;
  website: string | null;
  address: string | null;
  status: NgoStatus;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  ngo_id: string;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  funding_goal: number;
  current_funding: number;
  total_spent: number;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  ngo_details?: NgoDetails;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completed_at: string | null;
  is_completed: boolean;
  order_index: number;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  project_id: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
  project?: Project;
  profiles?: Profile;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  project_id: string;
  category_id: string;
  amount: number;
  description: string;
  receipt_url: string | null;
  vendor_name: string | null;
  expense_date: string;
  created_at: string;
  created_by: string;
  expense_categories?: ExpenseCategory;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  created_by: string;
}
