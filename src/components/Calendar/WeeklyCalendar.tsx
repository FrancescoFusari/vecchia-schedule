
import { useState, useEffect, useRef } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { formatDate, getWeekDates } from "@/lib/utils";
import { Shift, Employee } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { employeeService, shiftService } from "@/lib/supabase";
import { ShiftModal } from "../Shifts/ShiftModal";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { HoursSummary } from "../Reports/HoursSummary";
import { WeeklyCalendarHeader } from "./WeeklyCalendarHeader";
import { DesktopWeeklyCalendar } from "./DesktopWeeklyCalendar";
import { MobileWeeklyCalendar } from "./MobileWeeklyCalendar";

interface WeeklyCalendarProps {
  onViewChange?: (isWeekView: boolean) => void;
  'data-component'?: string;
}

export function WeeklyCalendar({
  onViewChange,
  'data-component': dataComponent
}: WeeklyCalendarProps) {
  const { isAdmin, user, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState<number | undefined>(undefined);
  const [weekDates, setWeekDates] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(),
    end: new Date()
  });
  const [expandedWeek, setExpandedWeek] = useState<boolean>(false);
  const [visibleDays, setVisibleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [currentUserEmployee, setCurrentUserEmployee] = useState<Employee | null>(null);
  const [showOnlyUserShifts, setShowOnlyUserShifts] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Set initial visible days based on current day of week when on mobile
  useEffect(() => {
    if (isMobile) {
      const today = new Date();
      let currentDayIndex = today.getDay();
      // Convert Sunday (0) to 6 to match our 0-based Monday-Sunday index
      currentDayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
      
      // Set visible days to include current day and the next 3 days
      const visibleIndices = [];
      for (let i = 0; i < 4; i++) {
        const dayIndex = (currentDayIndex + i) % 7;
        visibleIndices.push(dayIndex);
      }
      setVisibleDays(visibleIndices);
    } else {
      // On desktop, show all days
      setVisibleDays([0, 1, 2, 3, 4, 5, 6]);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Accesso richiesto",
        description: "Devi effettuare l'accesso per visualizzare il calendario.",
        variant: "destructive"
      });
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const employeeData = await employeeService.getEmployees();
        setEmployees(employeeData);

        // Find if the current user has an associated employee profile
        if (user && user.id) {
          const matchingEmployee = employeeData.find(emp => emp.userId === user.id);
          setCurrentUserEmployee(matchingEmployee || null);
        }

        const weekRange = getWeekDates(currentDate);
        setWeekDates(weekRange);
        const formattedStartDate = formatDate(weekRange.start);
        const formattedEndDate = formatDate(weekRange.end);
        console.log(`Fetching shifts from ${formattedStartDate} to ${formattedEndDate}`);
        const shiftData = await shiftService.getShifts(formattedStartDate, formattedEndDate);
        setShifts(shiftData);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        setHasError(true);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante il caricamento dei dati del calendario.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentDate, user]);

  useEffect(() => {
    const refreshCalendar = () => {
      if (user) {
        const weekRange = getWeekDates(currentDate);
        const formattedStartDate = formatDate(weekRange.start);
        const formattedEndDate = formatDate(weekRange.end);
        console.log(`Refreshing shifts from ${formattedStartDate} to ${formattedEndDate}`);
        shiftService.getShifts(formattedStartDate, formattedEndDate).then(shiftData => {
          setShifts(shiftData);
        }).catch(error => {
          console.error("Error refreshing shifts:", error);
        });
      }
    };
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && calendarRef.current?.classList.contains('refresh-trigger')) {
          refreshCalendar();
        }
      });
    });
    if (calendarRef.current) {
      observer.observe(calendarRef.current, {
        attributes: true
      });
    }
    return () => {
      observer.disconnect();
    };
  }, [currentDate, user]);

  const handlePrevWeek = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setDate(date.getDate() - 7);
      return date;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setDate(date.getDate() + 7);
      return date;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    if (isMobile) {
      const today = new Date();
      let currentDayIndex = today.getDay();
      // Convert Sunday (0) to 6 to match our 0-based Monday-Sunday index
      currentDayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
      
      // Update visible days to start from current day
      const visibleIndices = [];
      for (let i = 0; i < 4; i++) {
        const dayIndex = (currentDayIndex + i) % 7;
        visibleIndices.push(dayIndex);
      }
      setVisibleDays(visibleIndices);
    }
  };

  const handleNavPrevDay = () => {
    if (isMobile) {
      // Get the first visible day and calculate the previous day
      const firstVisibleDay = visibleDays[0];
      const prevDay = (firstVisibleDay - 1 + 7) % 7;
      
      // Create a new array by adding the previous day and removing the last day
      const newVisibleDays = [prevDay, ...visibleDays.slice(0, 3)];
      setVisibleDays(newVisibleDays);
    }
  };

  const handleNavNextDay = () => {
    if (isMobile) {
      // Get the last visible day and calculate the next day
      const lastVisibleDay = visibleDays[visibleDays.length - 1];
      const nextDay = (lastVisibleDay + 1) % 7;
      
      // Create a new array by removing the first day and adding the next day
      const newVisibleDays = [...visibleDays.slice(1), nextDay];
      setVisibleDays(newVisibleDays);
    }
  };

  const handleAddShift = (date: Date, dayOfWeek: number) => {
    setSelectedDate(date);
    setCurrentDayOfWeek(dayOfWeek);
    setIsAddingShift(true);
    setSelectedShift(null);
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setIsAddingShift(false);
  };

  const handleShiftModalClose = () => {
    setSelectedShift(null);
    setIsAddingShift(false);
  };

  const handleSaveShift = async (shift: Shift) => {
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
    } catch (error) {
      console.error("Error saving shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del turno. Assicurati di avere i permessi necessari.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await shiftService.deleteShift(shiftId);
      setShifts(prev => prev.filter(s => s.id !== shiftId));
      toast({
        title: "Turno eliminato",
        description: "Il turno è stato eliminato con successo."
      });
      handleShiftModalClose();
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del turno. Assicurati di avere i permessi necessari.",
        variant: "destructive"
      });
    }
  };

  const getUniqueShiftTimes = () => {
    const times = new Set<string>();
    shifts.forEach(shift => {
      times.add(shift.startTime);
    });
    return Array.from(times).sort();
  };

  const handleViewToggle = (isWeekView: boolean) => {
    if (onViewChange) {
      onViewChange(isWeekView);
    }
  };

  const toggleExpandedWeek = () => {
    setExpandedWeek(!expandedWeek);
  };

  const getShiftsByDayAndTime = () => {
    const shiftsByDay: Record<number, Record<string, Shift[]>> = {};
    for (let day = 0; day < 7; day++) {
      shiftsByDay[day] = {};
      getUniqueShiftTimes().forEach(time => {
        shiftsByDay[day][time] = [];
      });
    }
    
    const filteredShifts = showOnlyUserShifts && currentUserEmployee 
      ? shifts.filter(shift => shift.employeeId === currentUserEmployee.id)
      : shifts;
      
    filteredShifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      let dayOfWeek = shiftDate.getDay();
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      if (shiftsByDay[dayOfWeek][shift.startTime]) {
        shiftsByDay[dayOfWeek][shift.startTime].push(shift);
      }
    });
    return shiftsByDay;
  };

  const getShiftsByDay = () => {
    const shiftsByDay: Record<number, Shift[]> = {};
    for (let day = 0; day < 7; day++) {
      shiftsByDay[day] = [];
    }
    
    const filteredShifts = showOnlyUserShifts && currentUserEmployee 
      ? shifts.filter(shift => shift.employeeId === currentUserEmployee.id)
      : shifts;
      
    filteredShifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      let dayOfWeek = shiftDate.getDay();
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      shiftsByDay[dayOfWeek].push(shift);
    });
    for (let day = 0; day < 7; day++) {
      shiftsByDay[day].sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
    }
    return shiftsByDay;
  };

  const getEmployeeById = (id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  };

  const getFormattedDates = () => {
    const dates = [];
    const start = new Date(weekDates.start);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push({
        date,
        dayOfMonth: date.getDate(),
        isToday: new Date().toDateString() === date.toDateString()
      });
    }
    return dates;
  };

  const toggleShowOnlyUserShifts = () => {
    setShowOnlyUserShifts(!showOnlyUserShifts);
  };

  const shouldHighlightShift = (shift: Shift) => {
    if (!currentUserEmployee) return false;
    return shift.employeeId === currentUserEmployee.id;
  };

  const formattedDates = getFormattedDates();
  const shiftsByDayAndTime = getShiftsByDayAndTime();
  const shiftsByDay = getShiftsByDay();
  const uniqueShiftTimes = getUniqueShiftTimes();

  if (loading) {
    return <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in" ref={calendarRef} data-component={dataComponent}>
      <CalendarHeader 
        date={currentDate} 
        onPrevMonth={handlePrevWeek} 
        onNextMonth={handleNextWeek} 
        onToday={handleToday} 
        isWeekView={true} 
        onViewChange={handleViewToggle} 
      />
      
      <WeeklyCalendarHeader 
        isAdmin={isAdmin}
        currentUserEmployee={currentUserEmployee}
        expandedWeek={expandedWeek}
        showOnlyUserShifts={showOnlyUserShifts}
        onToggleExpandWeek={toggleExpandedWeek}
        onToggleUserShifts={toggleShowOnlyUserShifts}
      />
      
      {expandedWeek && (
        <div className="animate-in slide-in-from-top-5 duration-300">
          <HoursSummary shifts={shifts} employees={employees} currentDate={currentDate} />
        </div>
      )}
      
      {hasError && (
        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md text-destructive-foreground text-sm">
          Si è verificato un errore durante il caricamento dei dati. Prova ad aggiornare la pagina.
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {!isMobile && (
            <DesktopWeeklyCalendar 
              formattedDates={formattedDates}
              uniqueShiftTimes={uniqueShiftTimes}
              shiftsByDayAndTime={shiftsByDayAndTime}
              isAdmin={isAdmin}
              onAddShift={handleAddShift}
              onEditShift={handleEditShift}
              getEmployeeById={getEmployeeById}
              shouldHighlightShift={shouldHighlightShift}
            />
          )}
          
          {isMobile && (
            <MobileWeeklyCalendar 
              visibleDays={visibleDays}
              formattedDates={formattedDates}
              shiftsByDay={shiftsByDay}
              onAddShift={handleAddShift}
              onEditShift={handleEditShift}
              onPrevDays={handleNavPrevDay}
              onNextDays={handleNavNextDay}
              isAdmin={isAdmin}
              getEmployeeById={getEmployeeById}
              shouldHighlightShift={shouldHighlightShift}
            />
          )}
        </>
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
}
