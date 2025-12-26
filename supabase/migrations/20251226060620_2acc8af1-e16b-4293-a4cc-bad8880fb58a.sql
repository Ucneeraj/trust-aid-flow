-- Create table to store OTPs
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to manage OTPs (using service role)
CREATE POLICY "Allow service role full access" 
ON public.otp_codes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Auto-cleanup expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_cleanup_expired_otps
AFTER INSERT ON public.otp_codes
EXECUTE FUNCTION public.cleanup_expired_otps();