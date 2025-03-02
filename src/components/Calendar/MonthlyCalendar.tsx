
import { useState, useEffect } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarDay } from "./CalendarDay";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { getCalendarDays } from "@/lib/utils";
import { Shift, Employee } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { employeeService, shiftService } from "@/lib/supabase";
import { ShiftModal } from "../Shifts/ShiftModal";
import { HoursSummary } from "../Reports/HoursSummary";
import { useToast } from "@/hooks/use-toast";

export function MonthlyCalendar() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Load employees
        const employeeData = await employeeService.getAll();
        setEmployees(employeeData);
        
        // Load shifts (all for admin, only user's for employees)
        let shiftData: Shift[];
        if (isAdmin()) {
          shiftData = await shiftService.getAll();
        } else if (user) {
          shiftData = await shiftService.getEmployeeShifts(user.id);
        } else {
          shiftData = [];
        }
        setShifts(shiftData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Errore di caricamento",
          description: "Si è verificato un errore durante il caricamento dei dati.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [isAdmin, user, toast]);
  
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
        const updatedShift = await shiftService.update(shift);
        setShifts(prev => prev.map(s => s.id === shift.id ? updatedShift : s));
        toast({
          title: "Turno aggiornato",
          description: "Il turno è stato aggiornato con successo.",
        });
      } else {
        // Add new shift
        const newShift = await shiftService.create(shift);
        setShifts(prev => [...prev, newShift]);
        toast({
          title: "Turno aggiunto",
          description: "Il nuovo turno è stato aggiunto con successo.",
        });
      }
    } catch (error) {
      console.error("Error saving shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del turno.",
        variant: "destructive",
      });
    }
    
    handleShiftModalClose();
  };
  
  const handleDeleteShift = async (shiftId: string) => {
    try {
      await shiftService.delete(shiftId);
      setShifts(prev => prev.filter(s => s.id !== shiftId));
      toast({
        title: "Turno eliminato",
        description: "Il turno è stato eliminato con successo.",
      });
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del turno.",
        variant: "destructive",
      });
    }
    
    handleShiftModalClose();
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
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
      
      {/* Calendar grid */}
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
        <div className="grid grid-cols-7">
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
