-- Create creators table
CREATE TABLE public.creators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_seed TEXT,
  status TEXT NOT NULL DEFAULT 'Onboarding' CHECK (status IN ('Active', 'Onboarding', 'Paused', 'Offboarded')),
  revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  platform TEXT,
  followers TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_seed TEXT,
  role TEXT NOT NULL,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Inactive')),
  hire_date DATE,
  assigned_creators INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Review', 'Completed')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  assignee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.creators(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (will be scoped when auth is added)
CREATE POLICY "Anyone can view creators" ON public.creators FOR SELECT USING (true);
CREATE POLICY "Anyone can create creators" ON public.creators FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update creators" ON public.creators FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete creators" ON public.creators FOR DELETE USING (true);

CREATE POLICY "Anyone can view employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Anyone can create employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete employees" ON public.employees FOR DELETE USING (true);

CREATE POLICY "Anyone can view tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can create tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tasks" ON public.tasks FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON public.creators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.employees (name, email, role, department, status, avatar_seed, assigned_creators) VALUES
  ('Sarah Johnson', 'sarah@agency.com', 'Account Manager', 'Management', 'Active', 'sarah', 5),
  ('Alex Rivera', 'alex@agency.com', 'Video Editor', 'Production', 'Active', 'alex', 3),
  ('Jordan Lee', 'jordan@agency.com', 'Social Media Manager', 'Marketing', 'Active', 'jordan', 4),
  ('Mike Chen', 'mike@agency.com', 'Content Strategist', 'Strategy', 'Active', 'mike', 2);

INSERT INTO public.creators (name, email, status, revenue, platform, followers, avatar_seed) VALUES
  ('Emma Rose', 'emma@creator.com', 'Active', 125000, 'YouTube', '2.5M', 'emma'),
  ('Luna Star', 'luna@creator.com', 'Active', 89000, 'TikTok', '1.8M', 'luna'),
  ('Jessica Blake', 'jessica@creator.com', 'Onboarding', 0, 'Instagram', '500K', 'jessica'),
  ('Marcus Cole', 'marcus@creator.com', 'Paused', 45000, 'YouTube', '800K', 'marcus'),
  ('Sophia Chen', 'sophia@creator.com', 'Active', 156000, 'TikTok', '3.2M', 'sophia');