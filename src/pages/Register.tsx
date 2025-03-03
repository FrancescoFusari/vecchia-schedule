
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const Register = () => {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non corrispondono",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Errore",
        description: "La password deve contenere almeno 6 caratteri",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.registerEmployee(username, password, firstName, lastName);
      toast({
        title: "Registrazione completata",
        description: "Il tuo account è stato creato con successo. Ora puoi accedere.",
      });
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Errore di registrazione",
        description: error.message || "Si è verificato un errore durante la registrazione. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/lovable-uploads/5cec7ef1-53d9-4fab-ba62-9a1137e84da9.png" alt="La Vecchia Signora" className="h-24" />
          </div>
          <h1 className="text-3xl font-bold mb-2 animate-slide-up">La Vecchia Signora</h1>
          <p className="text-gray-600 animate-slide-up">Sistema di gestione turni</p>
        </div>
        
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Registrazione</CardTitle>
            <CardDescription>
              Crea un nuovo account dipendente
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="nome.utente"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    placeholder="Mario"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome</Label>
                  <Input
                    id="lastName"
                    placeholder="Rossi"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Conferma Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                <p className="mb-1 font-medium">Credenziali di demo:</p>
                <p>Admin: admin / juventus96</p>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creazione account..." : "Registrati"}
              </Button>
              <div className="text-center w-full">
                <p className="text-sm text-gray-500">
                  Hai già un account?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Accedi
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
