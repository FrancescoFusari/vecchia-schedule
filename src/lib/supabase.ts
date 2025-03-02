import { createClient } from '@supabase/supabase-js';
import { Employee, Shift, User, Role } from './types';

// Initialize the Supabase client with proper environment variables and fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jlhnhhlhjsrdxagwxlde.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsaG5oaGxoanNyZHhhZ3d4bGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NzAxMzQsImV4cCI6MjA1NjQ0NjEzNH0.JVg4rwNAYXN0if58rBxs3aV9iXdFGIUy6ZTCXALpsPU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication functions
export const authService = {
  // Sign in with username and password
  signIn: async (username: string, password: string) => {
    console.log("Auth service: signing in with username:", username);
    
    // Special case for Admin login
    if (username.toLowerCase() === "admin" && password === "juventus96") {
      console.log("Admin login attempt");
      
      try {
        // Check if admin exists
        const { data: existingAdmin, error: adminCheckError } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('username', 'Admin')
          .single();
        
        console.log("Existing admin check:", existingAdmin, adminCheckError);
        
        if (adminCheckError && adminCheckError.code !== 'PGRST116') {
          console.error("Error checking for admin:", adminCheckError);
          throw adminCheckError;
        }
        
        let adminId;
        
        // If admin doesn't exist, create one
        if (!existingAdmin) {
          console.log("Admin doesn't exist, creating...");
          
          // Create admin user in auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: `admin_${Date.now()}@example.com`,
            password: password,
            options: {
              data: {
                firstName: "Admin",
                lastName: "",
                role: "admin",
                username: "Admin"
              }
            }
          });
          
          if (authError) {
            console.error("Admin creation error:", authError);
            throw authError;
          }
          
          console.log("Admin created:", authData);
          adminId = authData.user?.id;
          
          // Wait for the trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          adminId = existingAdmin.id;
        }
        
        // Sign in as admin
        console.log("Signing in as admin");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: `admin_account@example.com`,
          password: password,
        });
        
        if (signInError) {
          console.error("Admin login error:", signInError);
          throw signInError;
        }
        
        console.log("Admin login successful:", signInData);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', 'Admin')
          .single();
        
        return {
          user: {
            id: profileData?.id || adminId,
            username: "Admin",
            role: "admin" as Role,
            firstName: "Admin",
            lastName: ""
          }
        };
      } catch (error) {
        console.error("Admin login process error:", error);
        throw error;
      }
    }
    
    // Regular user sign in
    try {
      console.log("Regular user login attempt");
      
      // First try to find if the user exists by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      console.log("Profile check:", profileData, profileError);
      
      if (profileError) {
        console.error("Error finding user by username:", profileError);
        throw new Error("User not found");
      }
      
      if (!profileData) {
        console.error("User not found with username:", username);
        throw new Error("User not found");
      }
      
      // We found the user, now try to sign in with their email
      // Get the auth user for this profile
      const { data: authUserData, error: authUserError } = await supabase.auth
        .signInWithPassword({
          email: profileData.email || `${username.toLowerCase()}@example.com`,
          password: password
        });
      
      console.log("Auth attempt:", authUserData, authUserError);
      
      if (authUserError) {
        console.error("Authentication error:", authUserError);
        throw authUserError;
      }
      
      console.log("Login successful:", profileData);
      
      return {
        user: {
          id: profileData.id,
          username: profileData.username,
          role: profileData.role as Role,
          firstName: profileData.first_name,
          lastName: profileData.last_name
        }
      };
    } catch (error) {
      console.error("Regular login process error:", error);
      throw error;
    }
  },
  
  // Register a new employee
  register: async (username: string, firstName: string, lastName: string, password: string) => {
    console.log("Registering new employee:", username);
    
    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();
    
    if (existingUser) {
      console.error("Username already exists:", username);
      throw new Error("Username already exists");
    }
    
    // Create the user in auth
    const { data, error } = await supabase.auth.signUp({
      email: `${username.toLowerCase()}@example.com`,
      password: password,
      options: {
        data: {
          firstName,
          lastName,
          role: "employee",
          username
        }
      }
    });
    
    if (error) {
      console.error("Registration error:", error);
      throw error;
    }
    
    console.log("Registration successful:", data);
    
    return {
      data,
      error: null
    };
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
  
  getCurrentUser: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      console.log("Getting current user:", data);
      
      if (data?.user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        console.log("Profile data:", profileData, error);
        
        if (profileData) {
          return {
            id: data.user.id,
            username: profileData.username || '',
            role: profileData.role as Role,
            firstName: profileData.first_name,
            lastName: profileData.last_name
          };
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }
};

// Data service for employees
export const employeeService = {
  getAll: async (): Promise<Employee[]> => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map((item: any) => ({
      id: item.id,
      firstName: item.first_name,
      lastName: item.last_name,
      email: item.email,
      phone: item.phone,
      position: item.position,
      createdAt: item.created_at
    }));
  },
  
  create: async (employee: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> => {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        position: employee.position
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      createdAt: data.created_at
    };
  },
  
  update: async (employee: Employee): Promise<Employee> => {
    const { data, error } = await supabase
      .from('employees')
      .update({
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        position: employee.position
      })
      .eq('id', employee.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      createdAt: data.created_at
    };
  },
  
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Data service for shifts
export const shiftService = {
  getAll: async (): Promise<Shift[]> => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    return data.map((item: any) => ({
      id: item.id,
      employeeId: item.employee_id,
      date: item.date,
      startTime: item.start_time,
      endTime: item.end_time,
      duration: item.duration,
      notes: item.notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  },
  
  getEmployeeShifts: async (employeeId: string): Promise<Shift[]> => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    return data.map((item: any) => ({
      id: item.id,
      employeeId: item.employee_id,
      date: item.date,
      startTime: item.start_time,
      endTime: item.end_time,
      duration: item.duration,
      notes: item.notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  },
  
  create: async (shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shift> => {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        employee_id: shift.employeeId,
        date: shift.date,
        start_time: shift.startTime,
        end_time: shift.endTime,
        duration: shift.duration,
        notes: shift.notes
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      employeeId: data.employee_id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      duration: data.duration,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },
  
  update: async (shift: Shift): Promise<Shift> => {
    const { data, error } = await supabase
      .from('shifts')
      .update({
        employee_id: shift.employeeId,
        date: shift.date,
        start_time: shift.startTime,
        end_time: shift.endTime,
        duration: shift.duration,
        notes: shift.notes
      })
      .eq('id', shift.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      employeeId: data.employee_id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      duration: data.duration,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },
  
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Export mock data for fallback or development purposes
export const mockData = {
  employees: [
    { id: "1", firstName: "Francesco", lastName: "R", email: "francesco.r@example.com", phone: "+39 123 456 7890", position: "Cameriere", createdAt: "2023-01-01" },
    { id: "2", firstName: "Francesco", lastName: "F", email: "francesco.f@example.com", phone: "+39 123 456 7891", position: "Cuoco", createdAt: "2023-01-01" },
    { id: "3", firstName: "Emanuele", lastName: "B", email: "emanuele@example.com", phone: "+39 123 456 7892", position: "Cameriere", createdAt: "2023-01-02" },
    { id: "4", firstName: "Giulia", lastName: "M", email: "giulia@example.com", phone: "+39 123 456 7893", position: "Hostess", createdAt: "2023-01-03" },
    { id: "5", firstName: "Cecilia", lastName: "P", email: "cecilia@example.com", phone: "+39 123 456 7894", position: "Barista", createdAt: "2023-01-04" },
    { id: "6", firstName: "Samuele", lastName: "G", email: "samuele@example.com", phone: "+39 123 456 7895", position: "Aiuto Cuoco", createdAt: "2023-01-05" },
    { id: "7", firstName: "Wojtek", lastName: "K", email: "wojtek@example.com", phone: "+39 123 456 7896", position: "Cameriere", createdAt: "2023-01-06" }
  ],
  
  // Generate some shifts for February 2024 based on the image
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
  ]
};
