
-- Fix the SECURITY DEFINER view warning by setting security_invoker
ALTER VIEW public.agencies_public SET (security_invoker = on);
