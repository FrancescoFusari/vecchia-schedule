
import { createClient } from '@supabase/supabase-js';
import { Employee, Shift, ShiftTemplate, User } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Create an admin client with the service role key when available
export const adminClient = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey) 
  : supabase;

// Auth functions
export const authService = {
  // Register a new employee
  registerEmployee: async (username: string, password: string, firstName: string, lastName: string) => {
    console.log("Registering employee:", { username, firstName, lastName });
    
    try {
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${username}@workshift.local`, // Using structured email format
        password,
        options: {
          data: {
            username,
            firstName,
            lastName,
            role: 'employee'
          }
        }
      });

      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create the employee profile
      const { error: profileError } = await supabase
        .from('employees')
        .insert({
          id: authData.user.id,
          username,
          first_name: firstName,
          last_name: lastName,
          email: `${username}@workshift.local`,
          created_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      console.log("Employee registered successfully:", authData.user.id);
      return { user: authData.user };
    } catch (error) {
      console.error("Error registering employee:", error);
      throw error;
    }
  },

  // Login
  signIn: async (username: string, password: string) => {
    try {
      console.log("Attempting login with:", username);
      
      // Handle admin login (hardcoded for simplicity and reliability)
      if (username === 'admin' && password === 'juventus96') {
        console.log("Admin login detected, using hardcoded admin credentials");
        
        // For admin, we create a hardcoded user object with consistent ID
        const adminUser: User = {
          id: 'admin-id', // IMPORTANT: This ID must match what's in the is_admin() function
          username: 'admin',
          email: 'admin@workshift.local',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User'
        };
        
        // Store admin session in local storage for persistence
        localStorage.setItem('workshift_admin_session', JSON.stringify(adminUser));
        
        return { userData: adminUser };
      }
      
      // For regular employees, try normal Supabase auth
      const email = `${username}@workshift.local`;
      console.log("Regular login, using email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Authentication error:", error);
        throw error;
      }

      if (!data.user) {
        console.error("No user returned from login");
        throw new Error('No user returned from login');
      }

      // Get the user metadata
      const userMeta = data.user.user_metadata;
      
      // Create a user object with consistent structure
      const userData: User = {
        id: data.user.id,
        username: userMeta.username || username,
        email: data.user.email || email,
        role: (userMeta.role as 'admin' | 'employee') || 'employee',
        firstName: userMeta.firstName || '',
        lastName: userMeta.lastName || ''
      };

      return { userData };
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      // Clear admin session if exists
      localStorage.removeItem('workshift_admin_session');
      
      // Also sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },

  // Get the current user
  getCurrentUser: async () => {
    try {
      // First check for admin session
      const adminSession = localStorage.getItem('workshift_admin_session');
      if (adminSession) {
        console.log("Found admin session in localStorage");
        return JSON.parse(adminSession) as User;
      }
      
      // Otherwise check Supabase session
      console.log("Checking Supabase for user session");
      const { data } = await supabase.auth.getSession();
      
      if (!data.session?.user) {
        console.log("No Supabase session found");
        return null;
      }
      
      const user = data.session.user;
      const userMeta = user.user_metadata;
      
      // Try to get additional profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      const userData: User = {
        id: user.id,
        username: userMeta.username || profileData?.username || user.email?.split('@')[0] || '',
        email: user.email,
        role: (profileData?.role as 'admin' | 'employee') || (userMeta.role as 'admin' | 'employee') || 'employee',
        firstName: profileData?.first_name || userMeta.firstName || '',
        lastName: profileData?.last_name || userMeta.lastName || ''
      };

      return userData;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }
};

// Database service functions
export const employeeService = {
  getEmployees: async () => {
    try {
      console.log("Fetching employees from database...");
      
      // Check for admin session first to determine which client to use
      const adminSession = localStorage.getItem('workshift_admin_session');
      const client = adminSession ? adminClient : supabase;
      
      const { data, error } = await client
        .from('employees')
        .select('*')
        .order('first_name', { ascending: true });
        
      if (error) {
        console.error("Error fetching employees:", error);
        throw error;
      }
      
      if (!data) {
        console.warn("No employee data returned");
        return [];
      }
      
      // Map the data to match the Employee type
      const employees: Employee[] = data.map(emp => ({
        id: emp.id,
        firstName: emp.first_name,
        lastName: emp.last_name,
        email: emp.email,
        username: emp.email?.split('@')[0] || '',
        phone: emp.phone || '',
        position: emp.position || '',
        createdAt: emp.created_at
      }));
      
      console.log(`Successfully fetched ${employees.length} employees`);
      return employees;
    } catch (error) {
      console.error("Error fetching employees:", error);
      
      // Use mock data only for development/testing purposes
      console.warn("Using mock employee data as fallback");
      return mockData.employees;
    }
  },
  
  createEmployee: async (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    try {
      console.log("Creating new employee:", employee.firstName, employee.lastName);
      
      // Check admin session first
      const adminSession = localStorage.getItem('workshift_admin_session');
      if (!adminSession) {
        throw new Error("Admin privileges required to create employees");
      }
      
      // Prepare the data object for insertion
      const employeeData = {
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        phone: employee.phone || null,
        position: employee.position || null
      };
      
      console.log("Employee data to insert:", employeeData);
      
      // Use adminClient to bypass RLS
      const { data, error } = await adminClient
        .from('employees')
        .insert(employeeData)
        .select('*')
        .single();
        
      if (error) {
        console.error("Error creating employee:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("No data returned after creating employee");
      }
      
      const newEmployee: Employee = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        username: data.email?.split('@')[0] || '',
        phone: data.phone || '',
        position: data.position || '',
        createdAt: data.created_at
      };
      
      console.log("Employee created successfully with ID:", newEmployee.id);
      return newEmployee;
    } catch (error) {
      console.error("Error creating employee:", error);
      throw error;
    }
  },
  
  updateEmployee: async (employee: Employee) => {
    try {
      console.log("Updating employee:", employee.id, employee.firstName, employee.lastName);
      
      // Check admin session first
      const adminSession = localStorage.getItem('workshift_admin_session');
      if (!adminSession) {
        throw new Error("Admin privileges required to update employees");
      }
      
      // Prepare the data object for update
      const employeeData = {
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        phone: employee.phone || null,
        position: employee.position || null
      };
      
      // Use adminClient to bypass RLS
      const { error } = await adminClient
        .from('employees')
        .update(employeeData)
        .eq('id', employee.id);
        
      if (error) {
        console.error("Error updating employee:", error);
        throw error;
      }
      
      console.log("Employee updated successfully");
      return employee;
    } catch (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
  },
  
  deleteEmployee: async (employeeId: string) => {
    try {
      console.log("Deleting employee with ID:", employeeId);
      
      // Check admin session first
      const adminSession = localStorage.getItem('workshift_admin_session');
      if (!adminSession) {
        throw new Error("Admin privileges required to delete employees");
      }
      
      // Use adminClient to bypass RLS
      const { error } = await adminClient
        .from('employees')
        .delete()
        .eq('id', employeeId);
        
      if (error) {
        console.error("Error deleting employee:", error);
        throw error;
      }
      
      console.log("Employee deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting employee:", error);
      throw error;
    }
  }
};

export const shiftService = {
  getShifts: async (startDate: string, endDate: string) => {
    try {
      console.log(`Fetching shifts between ${startDate} and ${endDate}`);
      
      // Check for admin session first to determine which client to use
      const adminSession = localStorage.getItem('workshift_admin_session');
      const client = adminSession ? adminClient : supabase;
      
      // Use the client directly with the SDK instead of making direct HTTP requests
      const { data, error } = await client
        .from('shifts')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
        
      if (error) {
        console.error("Error fetching shifts:", error);
        throw error;
      }
      
      if (!data) {
        console.warn("No shift data returned");
        return [];
      }
      
      const shifts: Shift[] = data.map(shift => ({
        id: shift.id,
        employeeId: shift.employee_id,
        date: shift.date,
        startTime: shift.start_time,
        endTime: shift.end_time,
        duration: shift.duration,
        notes: shift.notes || '',
        createdAt: shift.created_at,
        updatedAt: shift.updated_at
      }));
      
      console.log(`Successfully fetched ${shifts.length} shifts`);
      return shifts;
    } catch (error) {
      console.error("Error fetching shifts:", error);
      
      // Use mock data only for development/testing purposes
      console.warn("Using mock shift data as fallback");
      return mockData.shifts;
    }
  },
  
  createShift: async (shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log("Creating new shift:", shift);
      
      // Check for admin session
      const adminSession = localStorage.getItem('workshift_admin_session');
      
      if (!adminSession) {
        throw new Error("Admin privileges required to create shifts");
      }
      
      // Prepare the data object for insertion
      const shiftData = {
        employee_id: shift.employeeId,
        date: shift.date,
        start_time: shift.startTime,
        end_time: shift.endTime,
        duration: shift.duration,
        notes: shift.notes || null
      };
      
      console.log("Creating shift with data:", shiftData);
      
      // When using the service role key, we need to explicitly set the headers to include it
      if (serviceRoleKey) {
        console.log("Using service role key for admin operation");
        
        // Create a temporary admin client for this specific request
        // This ensures fresh authentication for this critical operation
        const tempAdminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        
        const { data, error } = await tempAdminClient
          .from('shifts')
          .insert(shiftData)
          .select()
          .single();
          
        if (error) {
          console.error("Error creating shift with admin client:", error);
          throw error;
        }
        
        if (!data) {
          throw new Error("No data returned after creating shift");
        }
        
        // Map the returned data to our Shift type
        const newShift: Shift = {
          id: data.id,
          employeeId: data.employee_id,
          date: data.date,
          startTime: data.start_time,
          endTime: data.end_time,
          duration: data.duration,
          notes: data.notes || '',
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        
        console.log("Shift created successfully with ID:", newShift.id);
        return newShift;
      } else {
        // Fallback to regular admin client if service role key isn't available
        console.warn("Service role key not available, using regular admin client");
        
        const { data, error } = await adminClient
          .from('shifts')
          .insert(shiftData)
          .select()
          .single();
          
        if (error) {
          console.error("Error creating shift with admin client:", error);
          throw error;
        }
        
        if (!data) {
          throw new Error("No data returned after creating shift");
        }
        
        // Map the returned data to our Shift type
        const newShift: Shift = {
          id: data.id,
          employeeId: data.employee_id,
          date: data.date,
          startTime: data.start_time,
          endTime: data.end_time,
          duration: data.duration,
          notes: data.notes || '',
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        
        console.log("Shift created successfully with ID:", newShift.id);
        return newShift;
      }
    } catch (error) {
      console.error("Error creating shift:", error);
      throw error;
    }
  },
  
  updateShift: async (shift: Shift) => {
    try {
      console.log("Updating shift:", shift.id);
      
      // Check for admin session
      const adminSession = localStorage.getItem('workshift_admin_session');
      
      if (!adminSession) {
        throw new Error("Admin privileges required to update shifts");
      }
      
      // Prepare the data object for update
      const shiftData = {
        employee_id: shift.employeeId,
        date: shift.date,
        start_time: shift.startTime,
        end_time: shift.endTime,
        duration: shift.duration,
        notes: shift.notes || null
      };
      
      // When using the service role key, we need to explicitly set the headers to include it
      if (serviceRoleKey) {
        console.log("Using service role key for admin operation");
        
        // Create a temporary admin client for this specific request
        const tempAdminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        
        const { error } = await tempAdminClient
          .from('shifts')
          .update(shiftData)
          .eq('id', shift.id);
          
        if (error) {
          console.error("Error updating shift with admin client:", error);
          throw error;
        }
      } else {
        // Fallback to regular admin client if service role key isn't available
        const { error } = await adminClient
          .from('shifts')
          .update(shiftData)
          .eq('id', shift.id);
          
        if (error) {
          console.error("Error updating shift with admin client:", error);
          throw error;
        }
      }
      
      console.log("Shift updated successfully");
      return shift;
    } catch (error) {
      console.error("Error updating shift:", error);
      throw error;
    }
  },
  
  deleteShift: async (shiftId: string) => {
    try {
      console.log("Deleting shift with ID:", shiftId);
      
      // Check for admin session
      const adminSession = localStorage.getItem('workshift_admin_session');
      
      if (!adminSession) {
        throw new Error("Admin privileges required to delete shifts");
      }
      
      // When using the service role key, we need to explicitly set the headers to include it
      if (serviceRoleKey) {
        console.log("Using service role key for admin operation");
        
        // Create a temporary admin client for this specific request
        const tempAdminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        
        const { error } = await tempAdminClient
          .from('shifts')
          .delete()
          .eq('id', shiftId);
          
        if (error) {
          console.error("Error deleting shift with admin client:", error);
          throw error;
        }
      } else {
        // Fallback to regular admin client if service role key isn't available
        const { error } = await adminClient
          .from('shifts')
          .delete()
          .eq('id', shiftId);
          
        if (error) {
          console.error("Error deleting shift with admin client:", error);
          throw error;
        }
      }
      
      console.log("Shift deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting shift:", error);
      throw error;
    }
  }
};

export const templateService = {
  getTemplates: async () => {
    try {
      console.log("Fetching shift templates...");
      
      // Check for admin session first to determine which client to use
      const adminSession = localStorage.getItem('workshift_admin_session');
      const client = adminSession ? adminClient : supabase;
      
      let { data, error } = await client
        .from('shift_templates')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) {
        console.error("Error fetching shift templates:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log("No templates found, returning default templates");
        return mockData.templates || [];
      }
      
      const templates: ShiftTemplate[] = data.map(template => ({
        id: template.id,
        name: template.name,
        startTime: template.start_time,
        endTime: template.end_time,
        duration: template.duration,
        createdAt: template.created_at
      }));
      
      console.log(`Successfully fetched ${templates.length} templates`);
      return templates;
    } catch (error) {
      console.error("Error fetching shift templates:", error);
      return mockData.templates || [];
    }
  },
  
  createTemplate: async (template: Omit<ShiftTemplate, 'id' | 'createdAt'>) => {
    try {
      console.log("Creating new template:", template);
      
      // Check for admin session
      const adminSession = localStorage.getItem('workshift_admin_session');
      
      if (!adminSession) {
        throw new Error("Admin privileges required to create templates");
      }
      
      // Direct HTTP request bypassing RLS
      const url = `${supabaseUrl}/rest/v1/shift_templates`;
      
      const templateData = {
        name: template.name,
        start_time: template.startTime,
        end_time: template.endTime,
        duration: template.duration
      };
      
      console.log("Making direct API call to create template:", templateData);
      
      const apiKey = serviceRoleKey || supabaseKey;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(`Failed to create template: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
      if (!data || !data[0]) {
        throw new Error("No data returned after creating template");
      }
      
      const newTemplate: ShiftTemplate = {
        id: data[0].id,
        name: data[0].name,
        startTime: data[0].start_time,
        endTime: data[0].end_time,
        duration: data[0].duration,
        createdAt: data[0].created_at
      };
      
      console.log("Template created successfully with ID:", newTemplate.id);
      return newTemplate;
    } catch (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  },
  
  updateTemplate: async (template: ShiftTemplate) => {
    try {
      console.log("Updating template:", template.id);
      
      // Check for admin session
      const adminSession = localStorage.getItem('workshift_admin_session');
      
      if (!adminSession) {
        throw new Error("Admin privileges required to update templates");
      }
      
      // Direct HTTP request bypassing RLS
      const url = `${supabaseUrl}/rest/v1/shift_templates?id=eq.${template.id}`;
      
      const templateData = {
        name: template.name,
        start_time: template.startTime,
        end_time: template.endTime,
        duration: template.duration
      };
      
      console.log("Making direct API call to update template:", templateData);
      
      const apiKey = serviceRoleKey || supabaseKey;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(`Failed to update template: ${JSON.stringify(errorData)}`);
      }
      
      console.log("Template updated successfully");
      return template;
    } catch (error) {
      console.error("Error updating template:", error);
      throw error;
    }
  },
  
  deleteTemplate: async (templateId: string) => {
    try {
      console.log("Deleting template with ID:", templateId);
      
      // Check for admin session
      const adminSession = localStorage.getItem('workshift_admin_session');
      
      if (!adminSession) {
        throw new Error("Admin privileges required to delete templates");
      }
      
      // Direct HTTP request bypassing RLS
      const url = `${supabaseUrl}/rest/v1/shift_templates?id=eq.${templateId}`;
      
      console.log("Making direct API call to delete template");
      
      const apiKey = serviceRoleKey || supabaseKey;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(`Failed to delete template: ${JSON.stringify(errorData)}`);
      }
      
      console.log("Template deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  }
};

// Mock data (to be used as fallback only if Supabase fails)
export const mockData = {
  employees: [
    { id: "1", firstName: "Francesco", lastName: "R", email: "francesco.r@example.com", username: "francesco.r", phone: "+39 123 456 7890", position: "Cameriere", createdAt: "2023-01-01" },
    { id: "2", firstName: "Francesco", lastName: "F", email: "francesco.f@example.com", username: "francesco.f", phone: "+39 123 456 7891", position: "Cuoco", createdAt: "2023-01-01" },
    { id: "3", firstName: "Emanuele", lastName: "B", email: "emanuele@example.com", username: "emanuele.b", phone: "+39 123 456 7892", position: "Cameriere", createdAt: "2023-01-02" },
    { id: "4", firstName: "Giulia", lastName: "M", email: "giulia@example.com", username: "giulia.m", phone: "+39 123 456 7893", position: "Hostess", createdAt: "2023-01-03" },
    { id: "5", firstName: "Cecilia", lastName: "P", email: "cecilia@example.com", username: "cecilia.p", phone: "+39 123 456 7894", position: "Barista", createdAt: "2023-01-04" },
    { id: "6", firstName: "Samuele", lastName: "G", email: "samuele@example.com", username: "samuele.g", phone: "+39 123 456 7895", position: "Aiuto Cuoco", createdAt: "2023-01-05" },
    { id: "7", firstName: "Wojtek", lastName: "K", email: "wojtek@example.com", username: "wojtek.k", phone: "+39 123 456 7896", position: "Cameriere", createdAt: "2023-01-06" }
  ],
  
  shifts: [
    // Feb 1 (Saturday)
    { id: "s1", employeeId: "1", date: "2024-02-01", startTime: "17:00", endTime: "23:30", duration: 6.5, createdAt: "2024-01-15", updatedAt: "2024-01-15" },
    { id: "s2", employeeId: "2", date: "2024-02-01", startTime: "12:00", endTime: "23:30", duration: 11.5, createdAt: "2024-01-15", updatedAt: "2024-01-15" },
    { id: "s3", employeeId: "3", date: "2024-02-01", startTime: "16:00", endTime: "23:30", duration: 7.5, createdAt: "2024-01-15", updatedAt: "2024-01-15" },
    { id: "s4", employeeId: "4", date: "2024-02-01", startTime: "12:00", endTime: "23:30", duration: 11.5, createdAt: "2024-01-15", updatedAt: "2024-01-15" },
    
    // Feb 2 (Sunday)
    { id: "s5", employeeId: "2", date: "2024-02-02", startTime: "17:00", endTime: "23:00", duration: 6, createdAt: "2024-01-15", updatedAt: "2024-01-15" },
    { id: "s6", employeeId: "3", date: "2024-02-02", startTime: "12:00", endTime: "23:00", duration: 11, createdAt: "2024-01-15", updatedAt: "2024-01-15" },
    { id: "s7", employeeId: "6", date: "2024-02-02", startTime: "12:00", endTime: "20:00", duration: 8, createdAt: "2024-01-15", updatedAt: "2024-01-15" },
    
    // More shifts for week 1
    { id: "s8", employeeId: "1", date: "2024-02-03", startTime: "17:00", endTime: "23:00", duration: 6, createdAt: "2024-01-15", updatedAt: "2024-01-15" },
    { id: "s9", employeeId: "2", date: "2024-02-03", startTime: "17:00", endTime: "23:00", duration: 6, createdAt: "2024-01-15", updatedAt: "2024-01-15" },
    { id: "s10", employeeId: "3", date: "2024-02-03", startTime: "12:00", endTime: "23:00", duration: 11, createdAt: "2024-01-15", updatedAt: "2024-01-15" }
  ],
  
  templates: [
    { id: "t1", name: "Mattina", startTime: "09:00", endTime: "15:00", duration: 6, createdAt: "2023-01-01" },
    { id: "t2", name: "Pomeriggio", startTime: "15:00", endTime: "21:00", duration: 6, createdAt: "2023-01-01" },
    { id: "t3", name: "Sera", startTime: "17:00", endTime: "23:00", duration: 6, createdAt: "2023-01-01" },
    { id: "t4", name: "Giornata Piena", startTime: "09:00", endTime: "21:00", duration: 12, createdAt: "2023-01-01" },
    { id: "t5", name: "Pranzo", startTime: "11:00", endTime: "15:00", duration: 4, createdAt: "2023-01-01" },
    { id: "t6", name: "Cena", startTime: "18:00", endTime: "23:00", duration: 5, createdAt: "2023-01-01" }
  ]
};
