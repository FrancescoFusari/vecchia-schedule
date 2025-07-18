import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";
import { WeeklyCalendar } from "@/components/Calendar/WeeklyCalendar";
import { VerticalCalendar } from "@/components/Calendar/VerticalCalendar";
import { useEffect, useState } from "react";
import { Employee, ShiftTemplate } from "@/lib/types";
import { employeeService, templateService, shiftService } from "@/lib/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, Eye, EyeOff, Users } from "lucide-react";
import { ShiftAssignmentModal } from "@/components/Shifts/ShiftAssignmentModal";
import { ShiftModal } from "@/components/Shifts/ShiftModal";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
const Calendar = () => {
  const isMobile = useIsMobile();
  const {
    isAdmin,
    user
  } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isWeekView, setIsWeekView] = useState(false);
  const [isVerticalView, setIsVerticalView] = useState(isMobile);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  const [showOnlyUserShifts, setShowOnlyUserShifts] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState<number | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Refresh trigger state to force calendar updates
  const [currentUserEmployee, setCurrentUserEmployee] = useState<Employee | null>(null);
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeeData = await employeeService.getEmployees();
        setEmployees(employeeData);

        // Find current user's employee record
        if (user) {
          const userEmployee = employeeData.find(emp => emp.userId === user.id);
          setCurrentUserEmployee(userEmployee || null);
        }
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
  }, [user]);
  useEffect(() => {
    setIsVerticalView(isMobile);
    if (isMobile) {
      setIsWeekView(false);
    }
  }, [isMobile]);
  const handleViewChange = (weekView: boolean) => {
    setIsWeekView(weekView);
    setIsVerticalView(false);
  };
  const handleEmployeeClick = () => {
    setIsAssignmentModalOpen(true);
  };
  const handleAssignmentComplete = () => {
    setIsAssignmentModalOpen(false);
    setRefreshTrigger(prev => prev + 1);
    setSelectedShift(null);
    setIsAddingShift(false);
    if (isVerticalView) {
      fetchShiftsForCurrentMonth();
    }
  };
  const handleToggleUserShifts = () => {
    setShowOnlyUserShifts(prev => !prev);
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
  }, [isVerticalView, currentDate, refreshTrigger]);
  const handleAddShift = (date: Date, dayOfWeek: number) => {
    setSelectedDate(date);
    setCurrentDayOfWeek(dayOfWeek);
    setIsAddingShift(true);
    setSelectedShift(null);
  };
  const handleEditShift = shift => {
    setSelectedShift(shift);
    setIsAddingShift(false);
  };
  const handleShiftModalClose = () => {
    setSelectedShift(null);
    setIsAddingShift(false);
  };
  const handleSaveShift = async shift => {
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
      setRefreshTrigger(prev => prev + 1);
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
  const handleDeleteShift = async shiftId => {
    try {
      await shiftService.deleteShift(shiftId);
      setShifts(prev => prev.filter(s => s.id !== shiftId));
      toast({
        title: "Turno eliminato",
        description: "Il turno è stato eliminato con successo."
      });
      handleShiftModalClose();
      setRefreshTrigger(prev => prev + 1);
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
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Function to get capitalized month name only
  const getCapitalizedMonth = (date: Date): string => {
    const month = date.toLocaleString('it', {
      month: 'long'
    });
    return month.charAt(0).toUpperCase() + month.slice(1);
  };
  return <div className="flex flex-col gap-3">
      {/* Calendar header section with glassmorphic effect on mobile */}
      <div className={`${isMobile ? 'sticky top-0 z-10 -mx-4 px-4 pt-1 pb-2' : ''}`}>
        <div className={`${isMobile ? 'glassmorphic rounded-lg p-3' : ''}`}>
          <h1 className="text-2xl font-medium">Calendario Turni</h1>
          
          
          <div className="flex flex-wrap items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Mese precedente">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-lg font-medium min-w-[100px] text-center">
                {getCapitalizedMonth(currentDate)}
              </div>
              
              <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Mese successivo">
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleToday}>
                Oggi
              </Button>
              
              {currentUserEmployee && <Toggle pressed={showOnlyUserShifts} onPressedChange={handleToggleUserShifts} className="relative gap-1 bg-primary/5 border-primary/20 hover:bg-primary/10 ml-2" aria-label="Mostra solo i miei turni">
                  <User className="h-4 w-4" />
                  {showOnlyUserShifts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Toggle>}
              
              {!isVerticalView && <div className="ml-2 flex items-center space-x-1">
                  <Switch id="view-mode" checked={isWeekView} onCheckedChange={handleViewChange} />
                  <Label htmlFor="view-mode" className="text-xs">
                    {isWeekView ? "Settimanale" : "Mensile"}
                  </Label>
                </div>}
            </div>
            
            {isAdmin() && <Button size="sm" onClick={handleEmployeeClick} className="gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Assegna turni</span>
              </Button>}
          </div>
        </div>
      </div>
      
      <div className="flex-grow">
        {isVerticalView ? <VerticalCalendar shifts={shifts} employees={employees} templates={templates} currentDate={currentDate} onDateChange={handleDateChange} isLoading={isLoading} onAddShift={handleAddShift} onEditShift={handleEditShift} showOnlyUserShifts={showOnlyUserShifts} /> : isWeekView ? <WeeklyCalendar onViewChange={handleViewChange} key={`weekly-${refreshTrigger}`} data-component="weekly-calendar" /> : <MonthlyCalendar onViewChange={handleViewChange} key={`monthly-${refreshTrigger}`} data-component="monthly-calendar" />}
      </div>
      
      <ShiftAssignmentModal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} employees={employees} templates={templates} currentMonth={currentDate} onShiftsAdded={handleAssignmentComplete} />
      
      {(isAddingShift || selectedShift) && <ShiftModal isOpen={isAddingShift || !!selectedShift} onClose={handleShiftModalClose} shift={selectedShift} date={selectedDate} dayOfWeek={currentDayOfWeek} employees={employees} onSave={handleSaveShift} onDelete={handleDeleteShift} />}
    </div>;
};
export default Calendar;