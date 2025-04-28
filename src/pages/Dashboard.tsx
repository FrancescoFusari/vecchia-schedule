import { useState, useMemo } from "react";
import { EmployeeTable } from "@/components/Employees/EmployeeTable";
import { EmployeeModal } from "@/components/Employees/EmployeeModal";
import { TemplateModal } from "@/components/Shifts/TemplateModal";
import { ShiftAssignmentModal } from "@/components/Shifts/ShiftAssignmentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LogOut, Users, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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
  isSameMonth,
  isFirstDayOfMonth,
  isLastDayOfMonth 
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
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  const [isShiftAssignmentModalOpen, setIsShiftAssignmentModalOpen] = useState(false);
  const [employeeForShiftAssignment, setEmployeeForShiftAssignment] = useState<Employee | null>(null);
  
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
  
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsEmployeeModalOpen(true);
  };
  
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEmployeeModalOpen(true);
  };
  
  const handleEmployeeClick = (employee: Employee) => {
    setEmployeeForShiftAssignment(employee);
    setIsShiftAssignmentModalOpen(true);
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

  const calculateWeeklyHours = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const weeks = eachWeekOfInterval(
      { start, end }, 
      { weekStartsOn: 1 } // 1 = Monday
    );
    
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
          templateUsage,
          isFirstWeek: isFirstDayOfMonth(weekStart) || weekStart <= start,
          isLastWeek: isLastDayOfMonth(weekEnd) || weekEnd >= end
        };
      });
      
      const totalMonthlyHours = shifts.filter(
        shift => 
          shift.employeeId === employee.id && 
          isSameMonth(parseISO(shift.date), currentMonth)
      ).reduce(
        (sum, shift) => sum + parseFloat(shift.duration.toString()), 
        0
      );
      
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

  const currentMonthName = format(currentMonth, 'MMMM yyyy', { locale: it });

  const [visibleWeekIndex, setVisibleWeekIndex] = useState(0);
  const maxVisibleWeeks = isMobile ? 2 : weeks.length;
  const visibleWeeks = weeks.slice(
    visibleWeekIndex, 
    Math.min(visibleWeekIndex + maxVisibleWeeks, weeks.length)
  );
  
  const handleNextWeeks = () => {
    if (visibleWeekIndex + maxVisibleWeeks < weeks.length) {
      setVisibleWeekIndex(prevIndex => prevIndex + maxVisibleWeeks);
    }
  };
  
  const handlePrevWeeks = () => {
    if (visibleWeekIndex > 0) {
      setVisibleWeekIndex(prevIndex => Math.max(0, prevIndex - maxVisibleWeeks));
    }
  };
  
  useEffect(() => {
    setVisibleWeekIndex(0);
  }, [currentMonth]);

  const handleShiftsAdded = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const shiftData = await shiftService.getShifts(
        start.toISOString().split('T')[0], 
        end.toISOString().split('T')[0]
      );
      setShifts(shiftData);
      
      toast({
        title: "Turni aggiornati",
        description: "I turni sono stati aggiornati con successo.",
      });
    } catch (error) {
      console.error("Error refreshing shifts:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare i turni.",
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
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="employees" className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Dipendenti</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Template</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Ore</span>
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
            onRowClick={handleEmployeeClick}
          />
          
          <EmployeeModal
            isOpen={isEmployeeModalOpen}
            onClose={() => setIsEmployeeModalOpen(false)}
            employee={selectedEmployee}
            onSave={handleSaveEmployee}
            onDelete={handleDeleteEmployee}
          />
          
          <ShiftAssignmentModal
            isOpen={isShiftAssignmentModalOpen}
            onClose={() => setIsShiftAssignmentModalOpen(false)}
            employee={employeeForShiftAssignment}
            templates={templates}
            currentMonth={currentMonth}
            onShiftsAdded={handleShiftsAdded}
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
            <CardHeader className="bg-primary/5 px-4 py-3 sm:px-6 sm:py-4 border-b">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <CardTitle className="text-xl font-semibold text-primary flex items-center">
                  <span className="capitalize">
                    Ore del mese: {currentMonthName}
                  </span>
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
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Mese Precedente</span>
                    <span className="sm:hidden">Prec</span>
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
                    <span className="hidden sm:inline">Mese Successivo</span>
                    <span className="sm:hidden">Succ</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="md:hidden">
                {employees.length === 0 ? (
                  <div className="text-center p-6 text-gray-500">
                    Nessun dipendente trovato
                  </div>
                ) : (
                  <div className="space-y-4 p-4">
                    {hoursData.map(({ employee, weeklyHours, totalHours, monthlyTemplateUsage }) => (
                      <Card 
                        key={employee.id} 
                        className="overflow-hidden border"
                        style={{ 
                          borderLeft: employee.color ? `4px solid ${employee.color}` : undefined 
                        }}
                      >
                        <CardHeader className="p-3 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: employee.color || '#9CA3AF' }} 
                            />
                            <h3 className="font-medium">{employee.firstName} {employee.lastName}</h3>
                          </div>
                          <div className="font-bold text-lg">
                            {totalHours.toFixed(1)}h
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y">
                            {weeklyHours.map((week, index) => (
                              <div key={index} className="p-3">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-xs text-muted-foreground">
                                    {format(week.weekStart, "dd/MM", { locale: it })} - {format(week.weekEnd, "dd/MM", { locale: it })}
                                  </p>
                                  <p className="font-medium">{week.hours.toFixed(1)}h</p>
                                </div>
                                {Object.entries(week.templateUsage).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {Object.entries(week.templateUsage).map(([template, count], i) => (
                                      <Badge 
                                        key={i} 
                                        variant="outline" 
                                        className="text-[10px]"
                                        style={{
                                          borderColor: employee.color ? `${employee.color}50` : undefined,
                                          backgroundColor: employee.color ? `${employee.color}15` : undefined
                                        }}
                                      >
                                        {template}: {count}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="hidden md:block">
                {isMobile && weeks.length > maxVisibleWeeks && (
                  <div className="flex justify-between items-center p-2 bg-muted/20 border-b">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handlePrevWeeks}
                      disabled={visibleWeekIndex === 0}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-xs font-medium">
                      Settimana {visibleWeekIndex/maxVisibleWeeks + 1} di {Math.ceil(weeks.length/maxVisibleWeeks)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleNextWeeks}
                      disabled={visibleWeekIndex + maxVisibleWeeks >= weeks.length}
                      className="h-8 px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold w-[180px] sticky left-0 bg-background z-10 shadow-[1px_0_0_0_#e5e7eb]">
                          Dipendente
                        </TableHead>
                        {visibleWeeks.map((week, index) => (
                          <TableHead key={index} className="text-center font-medium whitespace-nowrap">
                            <div className="text-xs">
                              {format(week, "dd", { locale: it })} - {format(endOfWeek(week, { weekStartsOn: 1 }), "dd MMM", { locale: it })}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center font-semibold whitespace-nowrap sticky right-0 bg-background z-10 shadow-[-1px_0_0_0_#e5e7eb]">
                          Totale Mese
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hoursData.map(({ employee, weeklyHours, totalHours }) => (
                        <TableRow key={employee.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium sticky left-0 bg-background z-10 shadow-[1px_0_0_0_#e5e7eb]">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: employee.color || '#9CA3AF' }} 
                              />
                              <span className="truncate">{employee.firstName} {employee.lastName}</span>
                            </div>
                          </TableCell>
                          {weeklyHours
                            .slice(visibleWeekIndex, visibleWeekIndex + maxVisibleWeeks)
                            .map((week, index) => (
                              <TableCell key={index} className="text-center p-1 sm:p-4">
                                <div className="flex flex-col items-center">
                                  <span className="font-medium text-sm sm:text-base">
                                    {week.hours.toFixed(1)}
                                  </span>
                                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 max-w-[110px]">
                                    {Object.entries(week.templateUsage).map(([template, count], i) => (
                                      <Badge 
                                        key={i} 
                                        variant="outline" 
                                        className="m-0.5 whitespace-nowrap text-[9px] sm:text-xs"
                                        style={{
                                          borderColor: employee.color ? `${employee.color}50` : undefined,
                                          backgroundColor: employee.color ? `${employee.color}15` : undefined
                                        }}
                                      >
                                        {template}: {count}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            ))}
                          <TableCell className="text-center font-bold sticky right-0 bg-muted/20 z-10 shadow-[-1px_0_0_0_#e5e7eb]">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
