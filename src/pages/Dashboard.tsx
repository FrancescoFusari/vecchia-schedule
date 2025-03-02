
import { useState } from "react";
import { EmployeeTable } from "@/components/Employees/EmployeeTable";
import { EmployeeModal } from "@/components/Employees/EmployeeModal";
import { TemplateModal } from "@/components/Shifts/TemplateModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LogOut, Users, Clock } from "lucide-react";
import { useEffect } from "react";
import { Employee, ShiftTemplate } from "@/lib/types";
import { employeeService, templateService } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  
  // Employee state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Template state
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  
  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeeData = await employeeService.getEmployees();
        setEmployees(employeeData);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare la lista dei dipendenti.",
          variant: "destructive",
        });
      }
    };
    
    fetchEmployees();
  }, []);
  
  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templateData = await templateService.getTemplates();
        setTemplates(templateData);
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i template.",
          variant: "destructive",
        });
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Employee handlers
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsEmployeeModalOpen(true);
  };
  
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEmployeeModalOpen(true);
  };
  
  const handleSaveEmployee = async (employee: Employee) => {
    try {
      const isNew = !employees.some(e => e.id === employee.id);
      
      if (isNew) {
        await employeeService.createEmployee(employee);
        setEmployees(prev => [...prev, employee]);
      } else {
        await employeeService.updateEmployee(employee);
        setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
      }
      
      setIsEmployeeModalOpen(false);
    } catch (error) {
      console.error("Error saving employee:", error);
      throw error;
    }
  };
  
  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await employeeService.deleteEmployee(employeeId);
      setEmployees(prev => prev.filter(e => e.id !== employeeId));
      setIsEmployeeModalOpen(false);
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
  };
  
  // Template handlers
  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    setIsTemplateModalOpen(true);
  };
  
  const handleEditTemplate = (template: ShiftTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateModalOpen(true);
  };
  
  const handleSaveTemplate = async (template: ShiftTemplate) => {
    try {
      const isNew = !templates.some(t => t.id === template.id);
      
      if (isNew) {
        await templateService.createTemplate(template);
        setTemplates(prev => [...prev, template]);
      } else {
        await templateService.updateTemplate(template);
        setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
      }
      
      setIsTemplateModalOpen(false);
      toast({
        title: isNew ? "Template aggiunto" : "Template aggiornato",
        description: isNew ? "Nuovo template aggiunto con successo." : "Template aggiornato con successo.",
      });
    } catch (error) {
      console.error("Error saving template:", error);
      throw error;
    }
  };
  
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await templateService.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setIsTemplateModalOpen(false);
      toast({
        title: "Template eliminato",
        description: "Il template è stato eliminato con successo.",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del template.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Gestione dipendenti e template</p>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="flex items-center text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma logout</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler effettuare il logout?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={() => signOut()}>Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <Tabs defaultValue="employees">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="employees" className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            <span>Dipendenti</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Template</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleAddEmployee}>
              <Plus className="mr-2 h-4 w-4" />
              Nuovo dipendente
            </Button>
          </div>
          
          <EmployeeTable
            employees={employees}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
          />
          
          <EmployeeModal
            isOpen={isEmployeeModalOpen}
            onClose={() => setIsEmployeeModalOpen(false)}
            employee={selectedEmployee}
            onSave={handleSaveEmployee}
            onDelete={handleDeleteEmployee}
          />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleAddTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuovo template
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleEditTemplate(template)}
              >
                <h3 className="font-medium text-lg">{template.name}</h3>
                <p className="text-gray-500">
                  {template.startTime} - {template.endTime}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {template.duration} ore
                </p>
              </Card>
            ))}
            
            {templates.length === 0 && (
              <Card className="p-6 text-center text-gray-500 col-span-full">
                Nessun template trovato
              </Card>
            )}
          </div>
          
          <TemplateModal
            isOpen={isTemplateModalOpen}
            onClose={() => setIsTemplateModalOpen(false)}
            template={selectedTemplate}
            onSave={handleSaveTemplate}
            onDelete={handleDeleteTemplate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
