import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { LogOut, Moon, Sun, User, MessageSquare, Utensils, FlaskConical } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { employeeService } from "@/lib/supabase";
import { Employee } from "@/lib/types";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";
const Profile = () => {
  const {
    user,
    signOut
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [linkedEmployee, setLinkedEmployee] = useState<Employee | null>(null);
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);
  const navigate = useNavigate();
  const {
    theme,
    setTheme
  } = useTheme();
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
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  if (!user) {
    return <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profilo Utente</h1>
      </div>

      <div className="space-y-6">
        {/* User Personal Info Card */}
        

        {/* Theme settings Card - Moved up in the hierarchy for better visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Impostazioni Tema</CardTitle>
            <CardDescription>Personalizza l'aspetto dell'applicazione</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Tema</h3>
                <p className="text-sm text-muted-foreground">Cambia tra tema chiaro e scuro</p>
              </div>
              <Button variant="outline" size="icon" onClick={toggleTheme} className="transition-all">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Cambia tema</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Experimental Features Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl">Funzionalità Sperimentali</CardTitle>
              <CardDescription>Scopri le nuove funzionalità in fase di sviluppo</CardDescription>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <FlaskConical className="h-6 w-6 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Link to="/communications" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Comunicazioni</span>
                </Button>
              </Link>
              <Link to="/orders" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Utensils className="mr-2 h-4 w-4" />
                  <span>Comande</span>
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Queste funzionalità sono in fase sperimentale e potrebbero subire modifiche.
            </p>
          </CardContent>
        </Card>

        {/* Employee Details Card */}
        {isLoadingEmployee ? <Card>
            <CardContent className="py-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card> : linkedEmployee ? <Card>
            <CardHeader>
              <CardTitle className="text-xl">Dettagli Dipendente</CardTitle>
              <CardDescription>Il tuo profilo dipendente collegato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Nome Completo</Label>
                  <Input value={`${linkedEmployee.firstName} ${linkedEmployee.lastName || ''}`} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Posizione</Label>
                  <Input value={linkedEmployee.position || 'Non specificata'} readOnly className="bg-muted" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Email</Label>
                  <Input value={linkedEmployee.email || 'Non specificata'} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Telefono</Label>
                  <Input value={linkedEmployee.phone || 'Non specificato'} readOnly className="bg-muted" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full" style={{
              backgroundColor: linkedEmployee.color
            }}></div>
                <span>Colore assegnato</span>
              </div>
            </CardContent>
          </Card> : <Card>
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
          </Card>}

        {/* Account Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Azioni Account</CardTitle>
          </CardHeader>
          <CardFooter className="flex justify-end">
            <Button variant="destructive" onClick={handleLogout} disabled={isLoading} className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              {isLoading ? "Logout in corso..." : "Logout"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>;
};
export default Profile;