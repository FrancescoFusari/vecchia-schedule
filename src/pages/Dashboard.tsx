import { useState } from "react";
import { EmployeeTable } from "@/components/Employees/EmployeeTable";
import { EmployeeModal } from "@/components/Employees/EmployeeModal";
import { TemplateModal } from "@/components/Shifts/TemplateModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LogOut, Users, Clock, Calendar, PieChart } from "lucide-react";
import { useEffect } from "react";
import { Employee, ShiftTemplate, Shift } from "@/lib/types";
import { employeeService, templateService, shiftService } from "@/lib/supabase";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachWeekOfInterval, 
  endOfWeek, 
  startOfWeek, 
  parseISO,
  isSameMonth 
} from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  
  // Hours report state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  
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
  
  // Fetch shifts for the current month
  useEffect(() => {
    const fetchMonthlyShifts = async () => {
      try {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        
        const shiftData = await shiftService.getShifts(
          start.toISOString().split('T')[0], // Format as YYYY-MM-DD string
          end.toISOString().split('T')[0]    // Format as YYYY-MM-DD string
        );
        setShifts(shiftData);
      } catch (error) {
        console.error("Error fetching shifts:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i turni del mese.",
          variant: "destructive",
        });
      }
    };
    
    fetchMonthlyShifts();
  }, [currentMonth]);
  
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

  // Calculate hours per employee per week (Monday to Sunday)
  const calculateWeeklyHours = () => {
    // Get all weeks in the current month (starting Monday)
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const weeks = eachWeekOfInterval(
      { start, end }, 
      { weekStartsOn: 1 } // 1 = Monday
    );
    
    // Generate the hours summary
    return employees.map(employee => {
      const weeklyHours = weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const employeeShifts = shifts.filter(
          shift => 
            shift.employeeId === employee.id && 
            new Date(shift.date) >= startOfWeek(weekStart, { weekStartsOn: 1 }) && 
            new Date(shift.date) <= weekEnd
        );
        
        const totalHours = employeeShifts.reduce(
          (sum, shift) => sum + parseFloat(shift.duration.toString()), 
          0
        );
        
        // Calculate shift template usage
        const templateUsage = templates.reduce((acc, template) => {
          const count = employeeShifts.filter(shift => 
            shift.startTime === template.startTime && 
            shift.endTime === template.endTime
          ).length;
          if (count > 0) {
            acc[template.name] = count;
          }
          return acc;
        }, {} as Record<string, number>);
        
        return {
          weekStart,
          weekEnd,
          hours: totalHours,
          templateUsage
        };
      });
      
      // Calculate total monthly hours (full month)
      const totalMonthlyHours = shifts.filter(
        shift => 
          shift.employeeId === employee.id && 
          isSameMonth(parseISO(shift.date), currentMonth)
      ).reduce(
        (sum, shift) => sum + parseFloat(shift.duration.toString()), 
        0
      );
      
      // Calculate template usage for entire month
      const monthlyTemplateUsage = templates.reduce((acc, template) => {
        const count = shifts.filter(shift => 
          shift.employeeId === employee.id &&
          isSameMonth(parseISO(shift.date), currentMonth) &&
          shift.startTime === template.startTime && 
          shift.endTime === template.endTime
        ).length;
        if (count > 0) {
          acc[template.name] = count;
        }
        return acc;
      }, {} as Record<string, number>);
      
      return {
        employee,
        weeklyHours,
        totalHours: totalMonthlyHours,
        monthlyTemplateUsage
      };
    });
  };

  const hoursData = calculateWeeklyHours();
  const weeks = eachWeekOfInterval({ 
    start: startOfMonth(currentMonth), 
    end: endOfMonth(currentMonth) 
  }, { weekStartsOn: 1 }); // Monday-based weeks

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
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="employees" className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            <span>Dipendenti</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Template</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Ore</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center justify-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>Analisi</span>
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
                className="p-4 cursor-pointer hover:bg-gray-50 transition-all border border-muted"
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
        
        <TabsContent value="hours" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="bg-primary/5 px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold text-primary">
                  Ore del mese: {format(currentMonth, 'MMMM yyyy', { locale: it })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(prevMonth => {
                      const newDate = new Date(prevMonth);
                      newDate.setMonth(newDate.getMonth() - 1);
                      return newDate;
                    })}
                  >
                    Mese Precedente
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(prevMonth => {
                      const newDate = new Date(prevMonth);
                      newDate.setMonth(newDate.getMonth() + 1);
                      return newDate;
                    })}
                  >
                    Mese Successivo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-semibold w-[180px]">Dipendente</TableHead>
                      {weeks.map((week, index) => (
                        <TableHead key={index} className="text-center font-medium">
                          {format(week, "dd", { locale: it })} - {format(endOfWeek(week, { weekStartsOn: 1 }), "dd MMM", { locale: it })}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-semibold">Totale Mese</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hoursData.map(({ employee, weeklyHours, totalHours }) => (
                      <TableRow key={employee.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium flex items-center">
                          {employee.color && (
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: employee.color }} 
                            />
                          )}
                          {employee.firstName} {employee.lastName}
                        </TableCell>
                        {weeklyHours.map((week, index) => (
                          <TableCell key={index} className="text-center">
                            <div className="flex flex-col">
                              <span className="font-medium">{week.hours.toFixed(1)}</span>
                              {Object.keys(week.templateUsage).length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {Object.entries(week.templateUsage).map(([template, count], i) => (
                                    <div key={i}>
                                      {template}: {count}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold bg-muted/20">
                          {totalHours.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {employees.length === 0 && (
                <div className="text-center p-6 text-gray-500">
                  Nessun dipendente trovato
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="bg-primary/5 px-6 py-4 border-b">
              <CardTitle className="text-xl font-semibold text-primary">
                Analisi Template per Dipendente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hoursData.map(({ employee, monthlyTemplateUsage, totalHours }) => (
                  <Card key={employee.id} className="border overflow-hidden">
                    <CardHeader 
                      className="p-4 border-b"
                      style={{ 
                        backgroundColor: employee.color ? `${employee.color}20` : undefined,
                        borderLeft: employee.color ? `4px solid ${employee.color}` : undefined
                      }}
                    >
                      <CardTitle className="text-lg flex items-center">
                        {employee.color && (
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: employee.color }} 
                          />
                        )}
                        {employee.firstName} {employee.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Totale ore: {totalHours.toFixed(1)}
                      </p>
                    </CardHeader>
                    <CardContent className="p-4">
                      {Object.keys(monthlyTemplateUsage).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(monthlyTemplateUsage).map(([template, count], i) => (
                            <div key={i} className="flex justify-between items-center">
                              <span className="font-medium">{template}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{count} turni</span>
                                <div className="bg-muted w-16 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full" 
                                    style={{ 
                                      width: `${(count / Object.values(monthlyTemplateUsage).reduce((a, b) => a + b, 0)) * 100}%`,
                                      backgroundColor: employee.color || '#3B82F6'
                                    }} 
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">
                          Nessun turno questo mese
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {employees.length === 0 && (
                  <div className="text-center p-6 text-gray-500 col-span-full">
                    Nessun dipendente trovato
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
