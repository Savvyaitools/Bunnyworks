-- 1) Allow creators to SELECT their own creator record (needed for portal linkage)
CREATE POLICY "Creators can view own creator record"
ON public.creators
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.user_type = 'creator'
      AND lower(p.email) = lower(creators.email)
  )
);

-- 2) Update creator-facing policies that join profiles<->creators by email to be case-insensitive

-- messages
DROP POLICY IF EXISTS "Creators can view their messages" ON public.messages;
CREATE POLICY "Creators can view their messages"
ON public.messages
FOR SELECT
USING (
  (EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND user_type = 'creator'
  ))
  AND (
    conversation_id = concat(
      'creator-',
      (
        SELECT c.id
        FROM public.creators c
        JOIN public.profiles p ON lower(p.email) = lower(c.email)
        WHERE p.id = auth.uid()
        LIMIT 1
      )
    )
  )
);

DROP POLICY IF EXISTS "Creators can update their messages" ON public.messages;
CREATE POLICY "Creators can update their messages"
ON public.messages
FOR UPDATE
USING (
  (EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND user_type = 'creator'
  ))
  AND (
    conversation_id = concat(
      'creator-',
      (
        SELECT c.id
        FROM public.creators c
        JOIN public.profiles p ON lower(p.email) = lower(c.email)
        WHERE p.id = auth.uid()
        LIMIT 1
      )
    )
  )
);

-- tasks
DROP POLICY IF EXISTS "Creators can view their own tasks" ON public.tasks;
CREATE POLICY "Creators can view their own tasks"
ON public.tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.creators c
    JOIN public.profiles p ON lower(p.email) = lower(c.email)
    WHERE p.id = auth.uid()
      AND c.id = tasks.creator_id
  )
);

-- invoices
DROP POLICY IF EXISTS "Creators can view their own invoices" ON public.invoices;
CREATE POLICY "Creators can view their own invoices"
ON public.invoices
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.creators c
    JOIN public.profiles p ON lower(p.email) = lower(c.email)
    WHERE p.id = auth.uid()
      AND c.id = invoices.creator_id
  )
);

-- earnings
DROP POLICY IF EXISTS "Creators can view their own earnings" ON public.creator_earnings;
CREATE POLICY "Creators can view their own earnings"
ON public.creator_earnings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.creators c
    JOIN public.profiles p ON lower(p.email) = lower(c.email)
    WHERE p.id = auth.uid()
      AND c.id = creator_earnings.creator_id
  )
);

-- content plans
DROP POLICY IF EXISTS "Creators can view their own content plans" ON public.content_plans;
CREATE POLICY "Creators can view their own content plans"
ON public.content_plans
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.creators c
    JOIN public.profiles p ON lower(p.email) = lower(c.email)
    WHERE p.id = auth.uid()
      AND c.id = content_plans.creator_id
  )
);