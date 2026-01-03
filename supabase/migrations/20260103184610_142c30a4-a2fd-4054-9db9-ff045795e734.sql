-- Create a function to sync employees with Chatter role to the chatters table
CREATE OR REPLACE FUNCTION public.sync_chatter_from_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT: Create chatter record if role is Chatter
  IF TG_OP = 'INSERT' AND NEW.role = 'Chatter' THEN
    INSERT INTO chatters (name, email, agency_id, auth_user_id, skill_grade, is_active)
    VALUES (NEW.name, NEW.email, NEW.agency_id, NEW.auth_user_id, 'B', NEW.status = 'Active')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- On UPDATE: Handle role changes and sync auth_user_id
  IF TG_OP = 'UPDATE' THEN
    -- If role changed TO Chatter, create chatter record
    IF NEW.role = 'Chatter' AND (OLD.role IS DISTINCT FROM 'Chatter') THEN
      INSERT INTO chatters (name, email, agency_id, auth_user_id, skill_grade, is_active)
      VALUES (NEW.name, NEW.email, NEW.agency_id, NEW.auth_user_id, 'B', NEW.status = 'Active')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- If role changed FROM Chatter, deactivate the chatter record
    IF OLD.role = 'Chatter' AND NEW.role IS DISTINCT FROM 'Chatter' THEN
      UPDATE chatters SET is_active = false 
      WHERE email = OLD.email AND agency_id = OLD.agency_id;
    END IF;
    
    -- Sync auth_user_id and status when employee is updated
    IF NEW.role = 'Chatter' THEN
      UPDATE chatters 
      SET 
        auth_user_id = NEW.auth_user_id,
        name = NEW.name,
        is_active = (NEW.status = 'Active')
      WHERE email = NEW.email AND agency_id = NEW.agency_id;
    END IF;
  END IF;
  
  -- On DELETE: Deactivate the chatter record
  IF TG_OP = 'DELETE' AND OLD.role = 'Chatter' THEN
    UPDATE chatters SET is_active = false 
    WHERE email = OLD.email AND agency_id = OLD.agency_id;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on employees table
DROP TRIGGER IF EXISTS sync_chatter_on_employee_change ON employees;
CREATE TRIGGER sync_chatter_on_employee_change
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW
EXECUTE FUNCTION sync_chatter_from_employee();