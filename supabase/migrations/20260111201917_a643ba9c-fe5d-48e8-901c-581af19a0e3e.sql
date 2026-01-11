-- Drop existing constraints and recreate to allow 'employee' type
ALTER TABLE public.internal_messages DROP CONSTRAINT IF EXISTS internal_messages_sender_type_check;
ALTER TABLE public.internal_messages DROP CONSTRAINT IF EXISTS internal_messages_recipient_type_check;

-- Add new constraints that include 'employee'
ALTER TABLE public.internal_messages 
ADD CONSTRAINT internal_messages_sender_type_check 
CHECK (sender_type IN ('chatter', 'agency', 'employee'));

ALTER TABLE public.internal_messages 
ADD CONSTRAINT internal_messages_recipient_type_check 
CHECK (recipient_type IN ('chatter', 'agency', 'employee'));