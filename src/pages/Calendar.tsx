import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";
import { WeeklyCalendar } from "@/components/Calendar/WeeklyCalendar";
import { VerticalCalendar } from "@/components/Calendar/VerticalCalendar";
import { useEffect, useState } from "react";
import { Employee, ShiftTemplate } from "@/lib/types";
import { employeeService, templateService, shiftService } from "@/lib/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { CalendarPlus, ChevronDown, ChevronRight, User } from "lucide-react";
import { ShiftAssignmentModal } from "@/components/Shifts/ShiftAssignmentModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ShiftModal } from "@/components/Shifts/ShiftModal";
import { toast } from "@/hooks/use-toast";

const Calendar = () => {
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isWeekView, setIsWeekView] = useState(false);
  const [isVerticalView, setIsVerticalView] = useState(isMobile);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isEmployeeListOpen, setIsEmployeeListOpen] = useState(!isMobile);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  
  const [selectedShift, setSelectedShift] = useState(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeeData = await employeeService.getEmployees();
        setEmployees(employeeData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    
    const fetchTemplates = async () => {
      try {
        const templateData = await templateService.getTemplates();
        setTemplates(templateData);
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };
    
    fetchEmployees();
    fetchTemplates();
  }, []);

  useEffect(() => {
    setIsVerticalView(isMobile);
    if (isMobile) {
      setIsEmployeeListOpen(false);
      setIsWeekView(false);
    }
  }, [isMobile]);
  
  const handleViewChange = (weekView: boolean) => {
    setIsWeekView(weekView);
    setIsVerticalView(false);
  };
  
  const handleEmployeeClick = (employee: Employee) => {
    if (isAdmin()) {
      setSelectedEmployee(employee);
      setIsAssignmentModalOpen(true);
    }
  };
  
  const handleAssignmentComplete = () => {
    setIsAssignmentModalOpen(false);
    if (isVerticalView) {
      fetchShiftsForCurrentMonth();
    } else if (isWeekView) {
      const weeklyCalendarElement = document.querySelector('[data-component="weekly-calendar"]');
      if (weeklyCalendarElement) {
        weeklyCalendarElement.classList.add('refresh-trigger');
        setTimeout(() => {
          weeklyCalendarElement.classList.remove('refresh-trigger');
        }, 100);
      }
    } else {
      const monthlyCalendarElement = document.querySelector('[data-component="monthly-calendar"]');
      if (monthlyCalendarElement) {
        monthlyCalendarElement.classList.add('refresh-trigger');
        setTimeout(() => {
          monthlyCalendarElement.classList.remove('refresh-trigger');
        }, 100);
      }
    }
  };
  
  const fetchShiftsForCurrentMonth = async () => {
    try {
      setIsLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1));
      
      const endDate = new Date(lastDay);
      const daysToAdd = 7 - endDate.getDay();
      endDate.setDate(endDate.getDate() + (daysToAdd === 7 ? 0 : daysToAdd));
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      console.log(`Fetching shifts for vertical calendar: ${formattedStartDate} to ${formattedEndDate}`);
      
      const shiftsData = await shiftService.getShifts(formattedStartDate, formattedEndDate);
      setShifts(shiftsData);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il caricamento dei turni.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVerticalView) {
      fetchShiftsForCurrentMonth();
    }
  }, [isVerticalView, currentDate]);

  const handleAddShift = (date: Date, dayOfWeek: number) => {
    setSelectedDate(date);
    setCurrentDayOfWeek(dayOfWeek);
    setIsAddingShift(true);
    setSelectedShift(null);
  };

  const handleEditShift = (shift) => {
    setSelectedShift(shift);
    setIsAddingShift(false);
  };

  const handleShiftModalClose = () => {
    setSelectedShift(null);
    setIsAddingShift(false);
  };

  const handleSaveShift = async (shift) => {
    try {
      if (selectedShift) {
        const updatedShift = await shiftService.updateShift(shift);
        setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
        toast({
          title: "Turno aggiornato",
          description: "Il turno è stato aggiornato con successo."
        });
      } else {
        const newShift = await shiftService.createShift(shift);
        setShifts(prev => [...prev, newShift]);
        toast({
          title: "Turno aggiunto",
          description: "Il nuovo turno è stato aggiunto con successo."
        });
      }
      handleShiftModalClose();
      if (isVerticalView) {
        fetchShiftsForCurrentMonth();
      }
    } catch (error) {
      console.error("Error saving shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del turno.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteShift = async (shiftId) => {
    try {
      await shiftService.deleteShift(shiftId);
      setShifts(prev => prev.filter(s => s.id !== shiftId));
      toast({
        title: "Turno eliminato",
        description: "Il turno è stato eliminato con successo."
      });
      handleShiftModalClose();
      if (isVerticalView) {
        fetchShiftsForCurrentMonth();
      }
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del turno.",
        variant: "destructive"
      });
    }
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario Turni</h1>
        <p className="text-muted-foreground">Visualizza e gestisci i turni dei dipendenti</p>
      </div>

      {isAdmin() && (
        <Collapsible
          open={isEmployeeListOpen}
          onOpenChange={setIsEmployeeListOpen}
          className="w-full bg-card rounded-lg shadow border border-border"
        >
          <div className="p-4 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Dipendenti
            </h2>
            <CollapsibleTrigger className="p-1.5 rounded-md hover:bg-muted/50">
              {isEmployeeListOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <ScrollArea className="w-full">
                <div className={`flex ${isMobile ? 'flex-wrap gap-2' : 'space-x-3'} pb-1 pr-4`}>
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className={`flex flex-col items-center p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors ${
                        isMobile ? 'mb-2 w-[65px]' : 'min-w-[80px]'
                      }`}
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      <Avatar className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} mb-2 flex items-center justify-center`} style={{ backgroundColor: employee.color }}>
                        <span className="text-sm font-medium text-white">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </Avatar>
                      <span className={`text-xs font-medium text-center ${isMobile ? 'text-[10px]' : ''}`}>
                        {employee.firstName} {employee.lastName}
                      </span>
                      <Badge
                        variant="outline"
                        className="mt-2 flex items-center gap-1 bg-primary/5 hover:bg-primary/10 text-primary"
                      >
                        <CalendarPlus className="h-3 w-3" />
                        <span className="text-xs">Assegna</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      <div className="flex-grow">
        {isVerticalView ? (
          <VerticalCalendar 
            shifts={shifts}
            employees={employees}
            templates={templates}
            currentDate={currentDate}
            onDateChange={handleDateChange}
            isLoading={isLoading}
            onAddShift={handleAddShift}
            onEditShift={handleEditShift}
          />
        ) : isWeekView ? (
          <WeeklyCalendar onViewChange={handleViewChange} key="weekly" data-component="weekly-calendar" />
        ) : (
          <MonthlyCalendar onViewChange={handleViewChange} key="monthly" data-component="monthly-calendar" />
        )}
      </div>
      
      {isAssignmentModalOpen && selectedEmployee && (
        <ShiftAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          employee={selectedEmployee}
          templates={templates}
          currentMonth={currentDate}
          onShiftsAdded={handleAssignmentComplete}
        />
      )}

      {(isAddingShift || selectedShift) && (
        <ShiftModal 
          isOpen={isAddingShift || !!selectedShift} 
          onClose={handleShiftModalClose} 
          shift={selectedShift} 
          date={selectedDate} 
          dayOfWeek={currentDayOfWeek} 
          employees={employees} 
          onSave={handleSaveShift} 
          onDelete={handleDeleteShift} 
        />
      )}
    </div>
  );
};

export default Calendar;
