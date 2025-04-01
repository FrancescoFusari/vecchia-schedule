
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeService } from "@/lib/supabase";
import { Employee } from "@/lib/types";

const Profile = () => {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [linkedEmployee, setLinkedEmployee] = useState<Employee | null>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLinkedEmployee = async () => {
      if (!user) return;
      
      try {
        setIsLoadingEmployee(true);
        const employees = await employeeService.getEmployees();
        const linked = employees.find(emp => emp.userId === user.id);
        setLinkedEmployee(linked || null);
      } catch (error) {
        console.error("Error fetching linked employee:", error);
      } finally {
        setIsLoadingEmployee(false);
      }
    };

    fetchLinkedEmployee();
  }, [user]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il logout",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profilo Utente</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl">Informazioni Personali</CardTitle>
              <CardDescription>I tuoi dati personali</CardDescription>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Username</Label>
                <Input value={user.username} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Ruolo</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Amministratore' : 'Dipendente'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nome</Label>
                <Input value={user.firstName || ''} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Cognome</Label>
                <Input value={user.lastName || ''} readOnly className="bg-muted" />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input value={user.email || ''} readOnly className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {isLoadingEmployee ? (
          <Card>
            <CardContent className="py-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ) : linkedEmployee ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Dettagli Dipendente</CardTitle>
              <CardDescription>Il tuo profilo dipendente collegato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Nome Completo</Label>
                  <Input 
                    value={`${linkedEmployee.firstName} ${linkedEmployee.lastName || ''}`} 
                    readOnly 
                    className="bg-muted" 
                  />
                </div>
                <div>
                  <Label>Posizione</Label>
                  <Input 
                    value={linkedEmployee.position || 'Non specificata'} 
                    readOnly 
                    className="bg-muted" 
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Email</Label>
                  <Input 
                    value={linkedEmployee.email || 'Non specificata'} 
                    readOnly 
                    className="bg-muted" 
                  />
                </div>
                <div>
                  <Label>Telefono</Label>
                  <Input 
                    value={linkedEmployee.phone || 'Non specificato'} 
                    readOnly 
                    className="bg-muted" 
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: linkedEmployee.color }}></div>
                <span>Colore assegnato</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Dettagli Dipendente</CardTitle>
              <CardDescription>Nessun profilo dipendente collegato</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Il tuo account utente non è collegato a nessun profilo dipendente. 
                Contatta l'amministratore per collegare il tuo account.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Azioni Account</CardTitle>
          </CardHeader>
          <CardFooter className="flex justify-end">
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoading ? "Logout in corso..." : "Logout"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
