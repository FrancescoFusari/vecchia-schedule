import { createClient } from '@supabase/supabase-js';
import { Employee, Shift, ShiftTemplate, User } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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
        
        // For admin, we create a hardcoded user object
        const adminUser: User = {
          id: 'admin-id',
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
      
      const userData: User = {
        id: user.id,
        username: userMeta.username || user.email?.split('@')[0] || '',
        email: user.email,
        role: (userMeta.role as 'admin' | 'employee') || 'employee',
        firstName: userMeta.firstName || '',
        lastName: userMeta.lastName || ''
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
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('first_name', { ascending: true });
        
      if (error) throw error;
      
      // Map the data to match the Employee type
      const employees: Employee[] = data.map(emp => ({
        id: emp.id,
        firstName: emp.first_name,
        lastName: emp.last_name,
        email: emp.email,
        username: emp.username || emp.email?.split('@')[0] || '',
        phone: emp.phone || '',
        position: emp.position || '',
        createdAt: emp.created_at
      }));
      
      return employees;
    } catch (error) {
      console.error("Error fetching employees:", error);
      return mockData.employees;
    }
  },
  
  // Additional employee service methods will be added here
};

export const shiftService = {
  getShifts: async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
        
      if (error) throw error;
      return data as Shift[];
    } catch (error) {
      console.error("Error fetching shifts:", error);
      return mockData.shifts;
    }
  },
  
  // Additional shift service methods will be added here
};

export const templateService = {
  getTemplates: async () => {
    try {
      const { data, error } = await supabase
        .from('shift_templates')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) throw error;
      return data as ShiftTemplate[];
    } catch (error) {
      console.error("Error fetching shift templates:", error);
      return [];
    }
  },
  
  // Additional template service methods will be added here
};

// Mock data (to be used as fallback)
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
    { id: "s10", employeeId: "3", date: "2024-02-03", startTime: "12:00", endTime: "23:00", duration: 11, createdAt: "2024-01-15", updatedAt: "2024-01-15" },
    
    // And many more shifts... (in a real app, these would come from Supabase)
    // For now this is just sample data to demonstrate the UI
  ]
};
