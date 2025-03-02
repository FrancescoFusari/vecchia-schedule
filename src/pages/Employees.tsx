
import { useState, useEffect } from "react";
import { Employee } from "@/lib/types";
import { EmployeeTable } from "@/components/Employees/EmployeeTable";
import { EmployeeModal } from "@/components/Employees/EmployeeModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { mockData } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmEmployeeId, setDeleteConfirmEmployeeId] = useState<string | null>(null);
  
  // Load employees
  useEffect(() => {
    // In a real app, this would fetch from Supabase
    setEmployees(mockData.employees);
  }, []);
  
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
  
  const confirmDeleteEmployee = () => {
    if (deleteConfirmEmployeeId) {
      setEmployees(prev => prev.filter(e => e.id !== deleteConfirmEmployeeId));
      setDeleteConfirmEmployeeId(null);
      toast({
        title: "Dipendente eliminato",
        description: "Il dipendente è stato eliminato con successo.",
      });
    }
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };
  
  const handleSaveEmployee = (employee: Employee) => {
    if (selectedEmployee) {
      // Update existing employee
      setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
      toast({
        title: "Dipendente aggiornato",
        description: "Le informazioni del dipendente sono state aggiornate con successo.",
      });
    } else {
      // Add new employee
      setEmployees(prev => [...prev, employee]);
      toast({
        title: "Dipendente aggiunto",
        description: "Il nuovo dipendente è stato aggiunto con successo.",
      });
    }
    
    handleModalClose();
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
      
      <EmployeeTable
        employees={employees}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
      />
      
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
