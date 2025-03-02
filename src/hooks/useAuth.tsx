import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService, supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check for admin session
        const adminSession = localStorage.getItem('workshift_admin_session');
        if (adminSession) {
          console.log("Found admin session in localStorage");
          setUser(JSON.parse(adminSession));
          setLoading(false);
          return;
        }
        
        // Otherwise check Supabase session
        const userData = await authService.getCurrentUser();
        console.log("Session check result:", userData ? "User logged in" : "No user");
        setUser(userData);
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      if (event === 'SIGNED_OUT') {
        // Also clear admin session on sign out
        localStorage.removeItem('workshift_admin_session');
        setUser(null);
      } else if (session?.user && event === 'SIGNED_IN') {
        authService.getCurrentUser().then(userData => {
          setUser(userData);
        });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);
      console.log("Attempting to sign in with username:", username);
      
      // This will use our simplified auth approach
      const { userData } = await authService.signIn(username, password);
      
      if (userData) {
        console.log("Login successful:", userData);
        setUser(userData);
        toast({
          title: "Login effettuato",
          description: `Benvenuto, ${userData.firstName || username}!`,
        });
      } else {
        console.error("No user data returned from login");
        throw new Error("Login failed - no user data returned");
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
