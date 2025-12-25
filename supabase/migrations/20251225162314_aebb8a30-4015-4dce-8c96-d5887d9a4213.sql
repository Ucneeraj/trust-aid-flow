-- Add social media columns to ngo_details table
ALTER TABLE public.ngo_details 
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add payment_method column to donations table for tracking payment info
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_id text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'completed';