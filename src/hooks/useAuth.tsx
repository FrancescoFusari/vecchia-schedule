
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService, supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

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
  const navigate = useNavigate();
  const location = useLocation();

  // Protected routes that require authentication
  const protectedRoutes = ['/', '/dashboard', '/profile', '/employees', '/templates', '/communications'];
  
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
        
        // Redirect to login page when signed out
        navigate('/login');
      } else if (session?.user && event === 'SIGNED_IN') {
        authService.getCurrentUser().then(userData => {
          setUser(userData);
        });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Check if the current route requires authentication and redirect if needed
  useEffect(() => {
    if (!loading) {
      const isProtectedRoute = protectedRoutes.some(route => 
        location.pathname === route || 
        (route !== '/' && location.pathname.startsWith(route))
      );
      
      if (isProtectedRoute && !user) {
        console.log('Unauthorized access to protected route, redirecting to login');
        navigate('/login');
      }
    }
  }, [user, loading, location.pathname, navigate]);

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
      
      // Explicitly navigate to login page after sign out
      navigate('/login');
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

  // This function should be absolutely reliable for admin check
  const isAdmin = () => {
    // Direct check for admin session in localStorage
    const adminSession = localStorage.getItem('workshift_admin_session');
    if (adminSession) {
      return true;
    }
    
    // Fallback to role check for the current user
    return user?.role === "admin" || user?.id === "admin-id";
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
