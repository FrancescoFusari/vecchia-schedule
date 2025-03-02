
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Role } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/supabase";

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
  const { toast } = useToast();

  useEffect(() => {
    // Check for current user on mount
    const checkUser = async () => {
      try {
        console.log("Checking for current user...");
        const currentUser = await authService.getCurrentUser();
        console.log("Current user:", currentUser);
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    
    // Set up auth state listener
    const { data } = authService.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        const currentUser = await authService.getCurrentUser();
        console.log("Updated user after state change:", currentUser);
        setUser(currentUser);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });
    
    // Clean up subscription on unmount
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("Attempting to sign in user:", email);
      const { data, error } = await authService.signIn(email, password);
      
      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }
      
      console.log("Sign in success, data:", data);
      
      if (data && data.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata.role as Role,
          firstName: data.user.user_metadata.firstName,
          lastName: data.user.user_metadata.lastName
        };
        
        console.log("Setting user data:", userData);
        setUser(userData);
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
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
