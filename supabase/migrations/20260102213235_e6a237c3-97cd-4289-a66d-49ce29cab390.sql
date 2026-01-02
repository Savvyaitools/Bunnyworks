-- Add onboarding_completed column to agencies table
ALTER TABLE public.agencies ADD COLUMN onboarding_completed boolean DEFAULT false;