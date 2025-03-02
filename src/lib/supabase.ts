
// This file is a placeholder for Supabase integration
// You'll need to replace this with actual Supabase client configuration
// after connecting to Supabase through the Lovable integration

export const supabase = {
  // Placeholder for actual Supabase client
  auth: {
    signIn: async (email: string, password: string) => {
      console.log("Sign in attempt", { email, password });
      // Mock login success
      if (email === "admin@example.com" && password === "password") {
        return { 
          data: { 
            user: { 
              id: "1", 
              email, 
              user_metadata: { 
                role: "admin",
                firstName: "Admin",
                lastName: "User" 
              } 
            } 
          }, 
          error: null 
        };
      }
      
      if (email === "employee@example.com" && password === "password") {
        return { 
          data: { 
            user: { 
              id: "2", 
              email, 
              user_metadata: { 
                role: "employee",
                firstName: "Employee",
                lastName: "User" 
              } 
            } 
          }, 
          error: null 
        };
      }
      
      return { data: null, error: new Error("Invalid credentials") };
    },
    signOut: async () => {
      console.log("Sign out");
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      // No-op for now
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  }
};

// This is a placeholder for demo purposes - in a real app, you'd use Supabase
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
    
    // And many more shifts... (in a real app, these would come from Supabase)
    // For now this is just sample data to demonstrate the UI
  ]
};
