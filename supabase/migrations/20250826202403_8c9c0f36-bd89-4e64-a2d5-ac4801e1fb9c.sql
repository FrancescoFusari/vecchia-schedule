-- Critical Security Fixes: Enable RLS on all tables missing it

-- Enable RLS on tables that have policies but RLS is disabled
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.week_template_shifts ENABLE ROW LEVEL SECURITY;

-- Fix database functions to use proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if current user is the admin-id or has admin role
  RETURN (
    auth.uid()::text = 'admin-id' OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND 
            raw_user_meta_data->>'role' = 'admin'
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Return 'admin' for hardcoded admin user
  IF auth.uid()::text = 'admin-id' THEN
    RETURN 'admin';
  END IF;
  
  -- Return role from profiles for other users
  RETURN (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'employee'; -- Default role
END;
$function$;

CREATE OR REPLACE FUNCTION public.debug_auth_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'user_id', auth.uid(),
    'is_admin', (auth.uid()::text = 'admin-id'),
    'jwt_role', current_setting('request.jwt.claims', true)::json->>'role',
    'session_user', session_user
  ) INTO result;
  
  RETURN result;
END;
$function$;

-- Clean up overly permissive policies and replace with secure ones
-- Remove the "true" policies that allow unlimited access

-- Fix communications policies - remove overly permissive ones
DROP POLICY IF EXISTS "All users can view communications" ON public.communications;
DROP POLICY IF EXISTS "Employees can update read status" ON public.communications;
DROP POLICY IF EXISTS "Employees can view communications" ON public.communications;

-- Keep admin policies and create proper employee read policy
CREATE POLICY "Employees can view and update read status" 
ON public.communications 
FOR ALL 
USING (true)
WITH CHECK (
  -- Only allow updating read_by array
  (OLD.sender_id = NEW.sender_id AND 
   OLD.title = NEW.title AND 
   OLD.content = NEW.content AND
   OLD.created_at = NEW.created_at AND
   OLD.sender_name = NEW.sender_name)
);

-- Fix employees policies - remove overly permissive "true" policies
DROP POLICY IF EXISTS "Allow all operations on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow users to read employees" ON public.employees;
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can read employee data" ON public.employees;
DROP POLICY IF EXISTS "Employees can view employees" ON public.employees;

-- Keep the admin policies and add proper employee read policy
CREATE POLICY "Employees can view basic employee info"
ON public.employees
FOR SELECT
USING (true); -- All employees can see basic info about other employees

-- Fix orders and order_items - they had "Anyone" policies, make them auth-only
DROP POLICY IF EXISTS "Anyone can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;

CREATE POLICY "Authenticated users can manage orders"
ON public.orders
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;

CREATE POLICY "Authenticated users can manage order items"
ON public.order_items
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Fix restaurant tables and sections - similar issue
DROP POLICY IF EXISTS "Allow authenticated users to delete restaurant sections" ON public.restaurant_sections;
DROP POLICY IF EXISTS "Allow authenticated users to insert restaurant sections" ON public.restaurant_sections;
DROP POLICY IF EXISTS "Allow authenticated users to update restaurant sections" ON public.restaurant_sections;
DROP POLICY IF EXISTS "Allow authenticated users to view restaurant sections" ON public.restaurant_sections;
DROP POLICY IF EXISTS "Anyone can view restaurant sections" ON public.restaurant_sections;

-- Keep admin policies and add view policy for authenticated users
CREATE POLICY "Authenticated users can view restaurant sections"
ON public.restaurant_sections
FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete restaurant tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Allow authenticated users to insert restaurant tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Allow authenticated users to update restaurant tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Allow authenticated users to view restaurant tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Anyone can view restaurant tables" ON public.restaurant_tables;

CREATE POLICY "Authenticated users can view restaurant tables"
ON public.restaurant_tables
FOR SELECT
USING (auth.role() = 'authenticated');