-- Enable full replica identity for complete row data in realtime updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;