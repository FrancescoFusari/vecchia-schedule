
import { useState, useEffect } from "react";
import { Employee } from "@/lib/types";
import { EmployeeTable } from "@/components/Employees/EmployeeTable";
import { EmployeeModal } from "@/components/Employees/EmployeeModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { employeeService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Employees = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmEmployeeId, setDeleteConfirmEmployeeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load employees
  useEffect(() => {
    async function loadEmployees() {
      try {
        setIsLoading(true);
        const data = await employeeService.getAll();
        setEmployees(data);
      } catch (error) {
        console.error("Error loading employees:", error);
        toast({
          title: "Errore di caricamento",
          description: "Si è verificato un errore durante il caricamento dei dipendenti.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadEmployees();
  }, [toast]);
  
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };
  
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };
  
  const handleDeleteEmployee = (employeeId: string) => {
    setDeleteConfirmEmployeeId(employeeId);
  };
  
  const confirmDeleteEmployee = async () => {
    if (deleteConfirmEmployeeId) {
      try {
        await employeeService.delete(deleteConfirmEmployeeId);
        setEmployees(prev => prev.filter(e => e.id !== deleteConfirmEmployeeId));
        setDeleteConfirmEmployeeId(null);
        toast({
          title: "Dipendente eliminato",
          description: "Il dipendente è stato eliminato con successo.",
        });
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante l'eliminazione del dipendente.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };
  
  const handleSaveEmployee = async (employee: Employee) => {
    try {
      if (selectedEmployee) {
        // Update existing employee
        const updatedEmployee = await employeeService.update(employee);
        setEmployees(prev => prev.map(e => e.id === employee.id ? updatedEmployee : e));
        toast({
          title: "Dipendente aggiornato",
          description: "Le informazioni del dipendente sono state aggiornate con successo.",
        });
      } else {
        // Add new employee
        const newEmployee = await employeeService.create({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          position: employee.position
        });
        setEmployees(prev => [...prev, newEmployee]);
        toast({
          title: "Dipendente aggiunto",
          description: "Il nuovo dipendente è stato aggiunto con successo.",
        });
      }
      
      handleModalClose();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del dipendente.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestione Dipendenti</h1>
          <p className="text-gray-500">Visualizza, aggiungi e gestisci dipendenti</p>
        </div>
        
        <Button onClick={handleAddEmployee}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Dipendente
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
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
