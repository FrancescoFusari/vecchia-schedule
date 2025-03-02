import { useState, useEffect } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarDay } from "./CalendarDay";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { getCalendarDays, formatDate } from "@/lib/utils";
import { Shift, Employee } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { employeeService, shiftService } from "@/lib/supabase";
import { ShiftModal } from "../Shifts/ShiftModal";
import { HoursSummary } from "../Reports/HoursSummary";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AdminPanel } from "@/components/ui/alert";

export function MonthlyCalendar() {
  const { isAdmin, user, loading } = useAuth();
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
  
  // Check authentication
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Accesso richiesto",
        description: "Devi effettuare l'accesso per visualizzare il calendario.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, loading, navigate]);
  
  // Load data
  useEffect(() => {
    // Don't fetch data if not authenticated
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Get employees
        const employeeData = await employeeService.getEmployees();
        setEmployees(employeeData);
        
        // Get shifts for current month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Create date range for the month (with padding for the calendar view)
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Add padding to include days from previous and next months that appear in the calendar
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1)); // Previous Monday
        
        const endDate = new Date(lastDay);
        const daysToAdd = 7 - endDate.getDay();
        endDate.setDate(endDate.getDate() + (daysToAdd === 7 ? 0 : daysToAdd)); // Next Sunday
        
        // Format dates for API
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
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentDate, user]);
  
  // Update calendar when month changes or when shifts change
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getCalendarDays(year, month, shifts);
    setCalendarDays(days);
  }, [currentDate, shifts]);
  
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
  
  const handleAddShift = (date: Date) => {
    setSelectedDate(date);
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
        // Update existing shift
        const updatedShift = await shiftService.updateShift(shift);
        setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
        toast({
          title: "Turno aggiornato",
          description: "Il turno è stato aggiornato con successo.",
        });
      } else {
        // Add new shift
        const newShift = await shiftService.createShift(shift);
        setShifts(prev => [...prev, newShift]);
        toast({
          title: "Turno aggiunto",
          description: "Il nuovo turno è stato aggiunto con successo.",
        });
      }
      
      handleShiftModalClose();
    } catch (error) {
      console.error("Error saving shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del turno. Assicurati di avere i permessi necessari.",
        variant: "destructive",
      });
      // Keep modal open for retry
    }
  };
  
  const handleDeleteShift = async (shiftId: string) => {
    try {
      await shiftService.deleteShift(shiftId);
      setShifts(prev => prev.filter(s => s.id !== shiftId));
      toast({
        title: "Turno eliminato",
        description: "Il turno è stato eliminato con successo.",
      });
      handleShiftModalClose();
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del turno. Assicurati di avere i permessi necessari.",
        variant: "destructive",
      });
      // Keep modal open for retry
    }
  };
  
  // If loading auth, show loading indicator
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authenticated, don't render anything (will redirect in effect)
  if (!user) {
    return null;
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Calendar header with navigation */}
      <CalendarHeader
        date={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
      
      {/* Admin information banner */}
      {isAdmin() && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm">
          <strong>Modalità Admin:</strong> Puoi aggiungere, modificare ed eliminare i turni cliccando sul calendario.
        </div>
      )}
      
      {/* Error banner */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-800 text-sm">
          Si è verificato un errore durante il caricamento dei dati. Prova ad aggiornare la pagina.
        </div>
      )}
      
      {/* Calendar grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="py-2 text-center font-semibold text-sm border-r last:border-r-0 border-gray-200">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
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
      
      {/* Hours summary */}
      <HoursSummary
        shifts={shifts}
        employees={employees}
        currentDate={currentDate}
      />
      
      {/* Shift modal for adding/editing shifts */}
      {(isAddingShift || selectedShift) && (
        <ShiftModal
          isOpen={true}
          onClose={handleShiftModalClose}
          shift={selectedShift}
          date={selectedDate}
          employees={employees}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
        />
      )}
    </div>
  );
}
