-- Fix notification cross-tenant leak by adding agency_id filtering to all 4 trigger functions

-- 1. Fix create_recruiting_notification - filter by NEW.agency_id
CREATE OR REPLACE FUNCTION public.create_recruiting_notification()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT p.id, 'New Recruitment Lead', 'New prospect added: ' || NEW.name, 'recruitment', '/recruiting'
  FROM profiles p 
  WHERE p.user_type = 'agency' 
    AND p.agency_id = NEW.agency_id;
  RETURN NEW;
END;
$function$;

-- 2. Fix notify_shift_change - get agency_id from creator
CREATE OR REPLACE FUNCTION public.notify_shift_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  chatter_name TEXT;
  creator_name TEXT;
  creator_agency_id UUID;
  action_text TEXT;
BEGIN
  SELECT c.name, c.agency_id INTO creator_name, creator_agency_id 
  FROM creators c WHERE c.id = COALESCE(NEW.creator_id, OLD.creator_id);
  
  SELECT name INTO chatter_name FROM chatters WHERE id = COALESCE(NEW.chatter_id, OLD.chatter_id);
  
  IF TG_OP = 'INSERT' THEN
    action_text := 'New shift assigned';
  ELSIF TG_OP = 'UPDATE' THEN
    action_text := 'Shift updated';
  ELSE
    action_text := 'Shift removed';
  END IF;
  
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT p.id, 
         'Shift Assignment Change',
         action_text || ': ' || COALESCE(chatter_name, 'Unknown') || ' on ' || COALESCE(creator_name, 'Unknown'),
         'shift',
         '/shift-roster'
  FROM profiles p 
  WHERE p.user_type = 'agency'
    AND p.agency_id = creator_agency_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 3. Fix notify_qc_assignment_change - filter by NEW.agency_id
CREATE OR REPLACE FUNCTION public.notify_qc_assignment_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  employee_name TEXT;
  block_label TEXT;
  action_text TEXT;
  target_agency_id UUID;
BEGIN
  target_agency_id := COALESCE(NEW.agency_id, OLD.agency_id);
  
  SELECT name INTO employee_name FROM employees WHERE id = COALESCE(NEW.qc_employee_id, OLD.qc_employee_id);
  
  block_label := CASE COALESCE(NEW.shift_block, OLD.shift_block)
    WHEN 'night' THEN '12 AM - 8 AM'
    WHEN 'day' THEN '8 AM - 4 PM'
    WHEN 'evening' THEN '4 PM - 12 AM'
    ELSE COALESCE(NEW.shift_block, OLD.shift_block)
  END;
  
  IF TG_OP = 'INSERT' THEN
    action_text := 'QC assigned';
  ELSIF TG_OP = 'UPDATE' THEN
    action_text := 'QC assignment updated';
  ELSE
    action_text := 'QC removed';
  END IF;
  
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT p.id,
         'QC Assignment Change',
         action_text || ': ' || COALESCE(employee_name, 'Unknown') || ' for ' || block_label || ' EST',
         'shift',
         '/shift-roster'
  FROM profiles p 
  WHERE p.user_type = 'agency'
    AND p.agency_id = target_agency_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 4. Fix check_coverage_gaps - agency-scope all counts and notifications
CREATE OR REPLACE FUNCTION public.check_coverage_gaps()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  night_count INTEGER;
  day_count INTEGER;
  evening_count INTEGER;
  today DATE := CURRENT_DATE;
  gap_message TEXT := '';
  target_agency_id UUID;
BEGIN
  SELECT c.agency_id INTO target_agency_id 
  FROM creators c WHERE c.id = COALESCE(NEW.creator_id, OLD.creator_id);
  
  IF target_agency_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  SELECT COUNT(*) INTO night_count FROM chatter_shifts cs
  JOIN creators c ON c.id = cs.creator_id
  WHERE cs.shift_start::date = today 
    AND EXTRACT(HOUR FROM cs.shift_start) >= 0 
    AND EXTRACT(HOUR FROM cs.shift_start) < 8
    AND c.agency_id = target_agency_id;
  
  SELECT COUNT(*) INTO day_count FROM chatter_shifts cs
  JOIN creators c ON c.id = cs.creator_id
  WHERE cs.shift_start::date = today 
    AND EXTRACT(HOUR FROM cs.shift_start) >= 8 
    AND EXTRACT(HOUR FROM cs.shift_start) < 16
    AND c.agency_id = target_agency_id;
  
  SELECT COUNT(*) INTO evening_count FROM chatter_shifts cs
  JOIN creators c ON c.id = cs.creator_id
  WHERE cs.shift_start::date = today 
    AND EXTRACT(HOUR FROM cs.shift_start) >= 16
    AND c.agency_id = target_agency_id;
  
  IF night_count = 0 THEN
    gap_message := gap_message || '12 AM - 8 AM, ';
  END IF;
  IF day_count = 0 THEN
    gap_message := gap_message || '8 AM - 4 PM, ';
  END IF;
  IF evening_count = 0 THEN
    gap_message := gap_message || '4 PM - 12 AM, ';
  END IF;
  
  IF gap_message != '' THEN
    gap_message := RTRIM(gap_message, ', ');
    
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT p.id,
           'Coverage Gap Detected',
           'No chatters assigned for: ' || gap_message || ' EST on ' || to_char(today, 'Mon DD'),
           'warning',
           '/shift-roster'
    FROM profiles p 
    WHERE p.user_type = 'agency'
      AND p.agency_id = target_agency_id
      AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.user_id = p.id 
        AND n.title = 'Coverage Gap Detected'
        AND n.created_at > NOW() - INTERVAL '1 hour'
      );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;