-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('donor', 'ngo', 'admin');

-- Create ngo_status enum
CREATE TYPE public.ngo_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Create project_status enum
CREATE TYPE public.project_status AS ENUM ('draft', 'active', 'completed', 'paused');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'donor',
  UNIQUE(user_id, role)
);

-- Create NGO details table
CREATE TABLE public.ngo_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  organization_name TEXT NOT NULL,
  registration_number TEXT,
  description TEXT,
  website TEXT,
  address TEXT,
  status ngo_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES public.ngo_details(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  funding_goal DECIMAL(12,2) NOT NULL DEFAULT 0,
  current_funding DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  status project_status NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  message TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create expense_categories table
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default expense categories
INSERT INTO public.expense_categories (name, icon) VALUES
  ('Supplies', 'package'),
  ('Labor', 'users'),
  ('Transportation', 'truck'),
  ('Equipment', 'wrench'),
  ('Administrative', 'file-text'),
  ('Medical', 'heart'),
  ('Education', 'book'),
  ('Food', 'utensils'),
  ('Infrastructure', 'building'),
  ('Other', 'more-horizontal');

-- Create expenses table (immutable - no updates/deletes allowed)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT,
  vendor_name TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Create project_updates table
CREATE TABLE public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to check if user owns the NGO
CREATE OR REPLACE FUNCTION public.is_ngo_owner(_user_id UUID, _ngo_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ngo_details
    WHERE id = _ngo_id AND user_id = _user_id
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own role during signup" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NGO details policies
CREATE POLICY "Anyone can view approved NGOs" ON public.ngo_details FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "NGOs can insert own details" ON public.ngo_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "NGOs can update own details" ON public.ngo_details FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Projects policies
CREATE POLICY "Anyone can view active projects" ON public.projects FOR SELECT USING (
  status = 'active' OR 
  status = 'completed' OR
  public.is_ngo_owner(auth.uid(), ngo_id) OR 
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "NGOs can insert projects" ON public.projects FOR INSERT WITH CHECK (public.is_ngo_owner(auth.uid(), ngo_id));
CREATE POLICY "NGOs can update own projects" ON public.projects FOR UPDATE USING (public.is_ngo_owner(auth.uid(), ngo_id) OR public.has_role(auth.uid(), 'admin'));

-- Milestones policies
CREATE POLICY "Anyone can view milestones" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "NGOs can manage milestones" ON public.milestones FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_ngo_owner(auth.uid(), p.ngo_id))
);
CREATE POLICY "NGOs can update milestones" ON public.milestones FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_ngo_owner(auth.uid(), p.ngo_id))
);

-- Donations policies
CREATE POLICY "Donors can view own donations" ON public.donations FOR SELECT USING (donor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "NGOs can view project donations" ON public.donations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_ngo_owner(auth.uid(), p.ngo_id))
);
CREATE POLICY "Authenticated users can donate" ON public.donations FOR INSERT WITH CHECK (auth.uid() = donor_id);

-- Expense categories policies
CREATE POLICY "Anyone can view expense categories" ON public.expense_categories FOR SELECT USING (true);

-- Expenses policies (SELECT only - no updates/deletes for transparency)
CREATE POLICY "Anyone can view expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "NGOs can insert expenses" ON public.expenses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_ngo_owner(auth.uid(), p.ngo_id)) AND
  auth.uid() = created_by
);

-- Project updates policies
CREATE POLICY "Anyone can view project updates" ON public.project_updates FOR SELECT USING (true);
CREATE POLICY "NGOs can insert updates" ON public.project_updates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_ngo_owner(auth.uid(), p.ngo_id)) AND
  auth.uid() = created_by
);

-- Function to update project funding totals
CREATE OR REPLACE FUNCTION public.update_project_funding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.projects
  SET current_funding = (
    SELECT COALESCE(SUM(amount), 0) FROM public.donations WHERE project_id = NEW.project_id
  )
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

-- Function to update project spending totals
CREATE OR REPLACE FUNCTION public.update_project_spending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.projects
  SET total_spent = (
    SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE project_id = NEW.project_id
  )
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

-- Triggers for automatic updates
CREATE TRIGGER on_donation_insert
  AFTER INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_funding();

CREATE TRIGGER on_expense_insert
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_spending();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'donor'));
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ngo_details_updated_at BEFORE UPDATE ON public.ngo_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();