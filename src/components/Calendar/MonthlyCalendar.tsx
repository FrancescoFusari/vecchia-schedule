import { useState, useEffect, useRef } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarDay } from "./CalendarDay";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { getCalendarDays, formatDate } from "@/lib/utils";
import { Shift, Employee } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { employeeService, shiftService } from "@/lib/supabase";
import { ShiftModal } from "../Shifts/ShiftModal";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, BarChart } from "lucide-react";
import { HoursSummary } from "../Reports/HoursSummary";

interface MonthlyCalendarProps {
  onViewChange?: (isWeekView: boolean) => void;
  'data-component'?: string;
}

export function MonthlyCalendar({
  onViewChange,
  'data-component': dataComponent
}: MonthlyCalendarProps) {
  const {
    isAdmin,
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState<number | undefined>(undefined);
  const [expandedMonth, setExpandedMonth] = useState<boolean>(false);
  const calendarRef = useRef<HTMLDivElement>(null);

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
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1));
        const endDate = new Date(lastDay);
        const daysToAdd = 7 - endDate.getDay();
        endDate.setDate(endDate.getDate() + (daysToAdd === 7 ? 0 : daysToAdd));
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
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
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getCalendarDays(year, month, shifts);
    setCalendarDays(days);
  }, [currentDate, shifts]);

  useEffect(() => {
    const refreshCalendar = () => {
      if (user) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1));
        const endDate = new Date(lastDay);
        const daysToAdd = 7 - endDate.getDay();
        endDate.setDate(endDate.getDate() + (daysToAdd === 7 ? 0 : daysToAdd));
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
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

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() - 1);
      return date;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() + 1);
      return date;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddShift = (date: Date, dayOfWeek: number) => {
    console.log(`Modal receiving date: ${formatDate(date)}, day of week: ${dayOfWeek}`);
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

  const toggleExpandedMonth = () => {
    setExpandedMonth(!expandedMonth);
  };

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
        onPrevMonth={handlePrevMonth} 
        onNextMonth={handleNextMonth} 
        onToday={handleToday} 
        isWeekView={false} 
        onViewChange={onViewChange} 
      />
      
      {isAdmin() && (
        <div className="flex justify-start">
          <Button 
            onClick={toggleExpandedMonth} 
            variant="outline" 
            size="sm" 
            className="gap-1 bg-primary/5 border-primary/20 hover:bg-primary/10"
          >
            <BarChart className="h-4 w-4" />
            Riepilogo Ore Mensili
            {expandedMonth ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      )}
      
      {expandedMonth && isAdmin() && (
        <div className="animate-in slide-in-from-top-5 duration-300">
          <HoursSummary shifts={shifts} employees={employees} currentDate={currentDate} />
        </div>
      )}
      
      {hasError && (
        <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 p-3 rounded-md text-destructive dark:text-destructive-foreground text-sm">
          Si è verificato un errore durante il caricamento dei dati. Prova ad aggiornare la pagina.
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="py-2 text-center font-semibold text-sm border-r last:border-r-0 border-border">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 auto-rows-fr">
            {calendarDays.map((day, index) => (
              <CalendarDay 
                key={index} 
                day={day} 
                employees={employees} 
                onAddShift={isAdmin() ? handleAddShift : undefined} 
                onEditShift={isAdmin() ? handleEditShift : undefined} 
              />
            ))}
          </div>
        </div>
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
