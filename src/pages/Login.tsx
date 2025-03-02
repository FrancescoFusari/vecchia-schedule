
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Info, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/supabase";

export default function Login() {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [creatingDemoAccounts, setCreatingDemoAccounts] = useState(false);
  
  // Check if the demo accounts exist and create them if necessary
  useEffect(() => {
    const setupDemoAccounts = async () => {
      try {
        setCreatingDemoAccounts(true);
        // Try to create demo admin account
        const { error: adminError } = await authService.createUser(
          "admin@example.com", 
          "password", 
          {
            firstName: "Admin",
            lastName: "User",
            role: "admin"
          }
        );

        // If there's an error but it's because the user already exists, that's fine
        if (adminError && !adminError.message.includes("already exists")) {
          console.error("Error creating admin demo account:", adminError);
        }

        // Try to create demo employee account
        const { error: employeeError } = await authService.createUser(
          "employee@example.com", 
          "password", 
          {
            firstName: "Employee",
            lastName: "User",
            role: "employee"
          }
        );

        if (employeeError && !employeeError.message.includes("already exists")) {
          console.error("Error creating employee demo account:", employeeError);
        }
      } catch (err) {
        console.error("Error setting up demo accounts:", err);
      } finally {
        setCreatingDemoAccounts(false);
      }
    };

    setupDemoAccounts();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Si è verificato un errore durante il login. Riprova.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Vecchia Schedule</CardTitle>
          <CardDescription className="text-center">Inserisci le credenziali per accedere</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tua.email@esempio.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoggingIn || loading || creatingDemoAccounts}>
              {isLoggingIn ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accesso in corso...
                </span>
              ) : creatingDemoAccounts ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparazione account demo...
                </span>
              ) : (
                "Accedi"
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Credenziali demo:</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Admin:</span>
                <span className="font-mono">admin@example.com / password</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dipendente:</span>
                <span className="font-mono">employee@example.com / password</span>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex-col space-y-4">
          <div className="flex items-center justify-center w-full text-sm text-gray-500">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            Accesso sicuro con Supabase Auth
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
