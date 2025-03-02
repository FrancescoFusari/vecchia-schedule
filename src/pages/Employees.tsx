import { useState, useEffect } from "react";
import { Employee } from "@/lib/types";
import { EmployeeTable } from "@/components/Employees/EmployeeTable";
import { EmployeeModal } from "@/components/Employees/EmployeeModal";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { employeeService } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmEmployeeId, setDeleteConfirmEmployeeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is admin, if not redirect to dashboard
  useEffect(() => {
    // Make sure admin session exists in localStorage
    const adminSession = localStorage.getItem('workshift_admin_session');
    
    if (!user) {
      // If no user is set yet, wait
      if (isLoading) return;
      
      toast({
        title: "Accesso negato",
        description: "Devi effettuare il login per accedere a questa pagina.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    if (!isAdmin() || !adminSession) {
      toast({
        title: "Accesso negato",
        description: "Solo gli amministratori possono accedere a questa pagina.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isAdmin, navigate, user, isLoading]);
  
  // Load employees
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setLoadingError(null);
      console.log("Fetching employees...");
      
      // Verify admin session exists
      const adminSession = localStorage.getItem('workshift_admin_session');
      if (!adminSession) {
        throw new Error("Admin session non trovata. Effettua nuovamente il login come amministratore.");
      }
      
      const data = await employeeService.getEmployees();
      console.log("Employees fetched:", data.length);
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      let errorMessage = "Si è verificato un errore durante il caricamento dei dipendenti.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setLoadingError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    // Only fetch if user is an admin
    const adminSession = localStorage.getItem('workshift_admin_session');
    if (user && isAdmin() && adminSession) {
      fetchEmployees();
    }
  }, [user, isAdmin]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEmployees();
  };
  
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };
  
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee({...employee});
    setIsModalOpen(true);
  };
  
  const handleDeleteEmployee = (employeeId: string) => {
    setDeleteConfirmEmployeeId(employeeId);
  };
  
  const confirmDeleteEmployee = async () => {
    if (deleteConfirmEmployeeId) {
      try {
        // Verify admin session exists
        const adminSession = localStorage.getItem('workshift_admin_session');
        if (!adminSession) {
          throw new Error("Admin session non trovata. Effettua nuovamente il login come amministratore.");
        }
        
        await employeeService.deleteEmployee(deleteConfirmEmployeeId);
        setEmployees(prev => prev.filter(e => e.id !== deleteConfirmEmployeeId));
        toast({
          title: "Dipendente eliminato",
          description: "Il dipendente è stato eliminato con successo.",
        });
      } catch (error) {
        console.error("Error deleting employee:", error);
        let errorMessage = "Si è verificato un errore durante l'eliminazione del dipendente.";
        
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Errore",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setDeleteConfirmEmployeeId(null);
      }
    }
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };
  
  const handleSaveEmployee = async (employee: Employee) => {
    try {
      // Verify admin session exists
      const adminSession = localStorage.getItem('workshift_admin_session');
      if (!adminSession) {
        throw new Error("Admin session non trovata. Effettua nuovamente il login come amministratore.");
      }
      
      if (selectedEmployee) {
        // Update existing employee
        const updatedEmployee = await employeeService.updateEmployee(employee);
        setEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
        toast({
          title: "Dipendente aggiornato",
          description: "Le informazioni del dipendente sono state aggiornate con successo.",
        });
      } else {
        // Add new employee
        const newEmployee = await employeeService.createEmployee(employee);
        setEmployees(prev => [...prev, newEmployee]);
        toast({
          title: "Dipendente aggiunto",
          description: "Il nuovo dipendente è stato aggiunto con successo.",
        });
      }
      
      handleModalClose();
    } catch (error) {
      console.error("Error saving employee:", error);
      
      // More specific error handling
      let errorMessage = "Si è verificato un errore durante il salvataggio del dipendente.";
      
      if (error instanceof Error) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "Un dipendente con questo username o email esiste già.";
        } else if (error.message.includes("validation")) {
          errorMessage = "I dati inseriti non sono validi. Controlla tutti i campi obbligatori.";
        } else if (error.message.includes("Admin privileges")) {
          errorMessage = "Solo gli amministratori possono gestire i dipendenti.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  // If not admin, don't render anything while checking
  if (!user) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not admin, don't render the actual content
  if (!isAdmin()) {
    return null;
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestione Dipendenti</h1>
          <p className="text-gray-500">Visualizza, aggiungi e gestisci dipendenti</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
          
          <Button onClick={handleAddEmployee}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Dipendente
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : loadingError ? (
        <div className="flex justify-center py-8 flex-col items-center">
          <p className="text-red-500 mb-4">{loadingError}</p>
          <Button onClick={() => window.location.reload()}>Riprova</Button>
        </div>
      ) : (
        <EmployeeTable
          employees={employees}
          onEdit={handleEditEmployee}
          onDelete={handleDeleteEmployee}
        />
      )}
      
      {isModalOpen && (
        <EmployeeModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          employee={selectedEmployee}
          onSave={handleSaveEmployee}
          onDelete={handleDeleteEmployee}
        />
      )}
      
      <AlertDialog open={!!deleteConfirmEmployeeId} onOpenChange={() => setDeleteConfirmEmployeeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione eliminerà definitivamente il dipendente e tutti i suoi turni. Non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEmployee}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Employees;
