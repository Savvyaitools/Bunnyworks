
-- Create function to notify on shift assignment changes
CREATE OR REPLACE FUNCTION public.notify_shift_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  chatter_name TEXT;
  creator_name TEXT;
  action_text TEXT;
BEGIN
  -- Get chatter name
  SELECT name INTO chatter_name FROM chatters WHERE id = COALESCE(NEW.chatter_id, OLD.chatter_id);
  
  -- Get creator name
  SELECT name INTO creator_name FROM creators WHERE id = COALESCE(NEW.creator_id, OLD.creator_id);
  
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    action_text := 'New shift assigned';
  ELSIF TG_OP = 'UPDATE' THEN
    action_text := 'Shift updated';
  ELSE
    action_text := 'Shift removed';
  END IF;
  
  -- Notify all agency users
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT p.id, 
         'Shift Assignment Change',
         action_text || ': ' || COALESCE(chatter_name, 'Unknown') || ' on ' || COALESCE(creator_name, 'Unknown'),
         'shift',
         '/shift-roster'
  FROM profiles p 
  WHERE p.user_type = 'agency';
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for shift changes
DROP TRIGGER IF EXISTS on_shift_change ON chatter_shifts;
CREATE TRIGGER on_shift_change
  AFTER INSERT OR UPDATE OR DELETE ON chatter_shifts
  FOR EACH ROW
  EXECUTE FUNCTION notify_shift_change();

-- Create function to notify on QC assignment changes
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
BEGIN
  -- Get employee name
  SELECT name INTO employee_name FROM employees WHERE id = COALESCE(NEW.qc_employee_id, OLD.qc_employee_id);
  
  -- Get readable block label
  block_label := CASE COALESCE(NEW.shift_block, OLD.shift_block)
    WHEN 'night' THEN '12 AM - 8 AM'
    WHEN 'day' THEN '8 AM - 4 PM'
    WHEN 'evening' THEN '4 PM - 12 AM'
    ELSE COALESCE(NEW.shift_block, OLD.shift_block)
  END;
  
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    action_text := 'QC assigned';
  ELSIF TG_OP = 'UPDATE' THEN
    action_text := 'QC assignment updated';
  ELSE
    action_text := 'QC removed';
  END IF;
  
  -- Notify all agency users
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT p.id,
         'QC Assignment Change',
         action_text || ': ' || COALESCE(employee_name, 'Unknown') || ' for ' || block_label || ' EST',
         'shift',
         '/shift-roster'
  FROM profiles p 
  WHERE p.user_type = 'agency';
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for QC assignment changes
DROP TRIGGER IF EXISTS on_qc_assignment_change ON qc_shift_assignments;
CREATE TRIGGER on_qc_assignment_change
  AFTER INSERT OR UPDATE OR DELETE ON qc_shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_qc_assignment_change();

-- Create function to check coverage gaps and notify
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
BEGIN
  -- Count shifts for each block today
  SELECT COUNT(*) INTO night_count FROM chatter_shifts 
  WHERE shift_start::date = today 
  AND EXTRACT(HOUR FROM shift_start) >= 0 
  AND EXTRACT(HOUR FROM shift_start) < 8;
  
  SELECT COUNT(*) INTO day_count FROM chatter_shifts 
  WHERE shift_start::date = today 
  AND EXTRACT(HOUR FROM shift_start) >= 8 
  AND EXTRACT(HOUR FROM shift_start) < 16;
  
  SELECT COUNT(*) INTO evening_count FROM chatter_shifts 
  WHERE shift_start::date = today 
  AND EXTRACT(HOUR FROM shift_start) >= 16;
  
  -- Build gap message
  IF night_count = 0 THEN
    gap_message := gap_message || '12 AM - 8 AM, ';
  END IF;
  IF day_count = 0 THEN
    gap_message := gap_message || '8 AM - 4 PM, ';
  END IF;
  IF evening_count = 0 THEN
    gap_message := gap_message || '4 PM - 12 AM, ';
  END IF;
  
  -- If there are gaps, notify agency users
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
    -- Avoid duplicate notifications within the same hour
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

-- Create trigger to check coverage after shift changes
DROP TRIGGER IF EXISTS check_coverage_after_shift_change ON chatter_shifts;
CREATE TRIGGER check_coverage_after_shift_change
  AFTER INSERT OR UPDATE OR DELETE ON chatter_shifts
  FOR EACH STATEMENT
  EXECUTE FUNCTION check_coverage_gaps();
