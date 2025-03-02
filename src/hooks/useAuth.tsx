
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User, Role } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock authentication state for demo purposes
    // In a real app, this would check Supabase session
    const storedUser = localStorage.getItem("workshift_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
    
    // Clean up subscription on unmount
    return () => {
      // No-op for mock implementation
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signIn(email, password);
      
      if (error) throw error;
      
      if (data && data.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata.role as Role,
          firstName: data.user.user_metadata.firstName,
          lastName: data.user.user_metadata.lastName
        };
        
        setUser(userData);
        localStorage.setItem("workshift_user", JSON.stringify(userData));
        toast({
          title: "Login effettuato",
          description: `Benvenuto, ${userData.firstName}!`,
        });
      }
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        title: "Errore di login",
        description: "Credenziali non valide. Riprova.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem("workshift_user");
      toast({
        title: "Logout effettuato",
        description: "Hai effettuato il logout con successo.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il logout.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
