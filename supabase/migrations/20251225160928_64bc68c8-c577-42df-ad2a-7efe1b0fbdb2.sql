-- Fix: Restrict profiles SELECT policy to only allow users to view their own profile
-- or allow viewing by admins (for admin dashboard purposes)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Also allow NGO owners to see donor names for their projects
CREATE POLICY "NGOs can view donor profiles for their projects"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.donations d
    JOIN public.projects p ON d.project_id = p.id
    WHERE d.donor_id = profiles.id
    AND is_ngo_owner(auth.uid(), p.ngo_id)
  )
);