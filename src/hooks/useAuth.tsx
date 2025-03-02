
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
  const [authInitialized, setAuthInitialized] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (session?.user && event === 'SIGNED_IN') {
        authService.getCurrentUser().then(userData => {
          setUser(userData);
        });
      }
    });

    return () => {
      // Clean up subscription
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);
      const { userData } = await authService.signIn(username, password);
      
      if (userData) {
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
