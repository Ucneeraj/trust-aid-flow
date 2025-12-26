-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;