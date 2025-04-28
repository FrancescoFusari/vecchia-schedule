
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Employee, Shift } from "@/lib/types";
import { ShiftAssignmentModal } from "@/components/Shifts/ShiftAssignmentModal";
import { MobileShiftAssignmentModal } from "@/components/Shifts/MobileShiftAssignmentModal";
import { ShiftModal } from "@/components/Shifts/ShiftModal";
import { useCalendarState } from "@/hooks/useCalendarState";
import { CalendarViewToggle } from "@/components/Calendar/CalendarViewToggle";
import { CalendarContent } from "@/components/Calendar/CalendarContent";
import { CalendarPageHeader } from "@/components/Calendar/CalendarPageHeader";
import { shiftService } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const Calendar = () => {
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const [isWeekView, setIsWeekView] = useState(false);
  const [isVerticalView, setIsVerticalView] = useState(isMobile);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState<number | undefined>(undefined);

  const { employees, templates, isLoading: isLoadingEmployees } = useCalendarState();

  useEffect(() => {
    setIsVerticalView(isMobile);
    if (isMobile) {
      setIsWeekView(false);
    }
  }, [isMobile]);

  const fetchShiftsForCurrentMonth = useCallback(async () => {
    if (isLoadingShifts) return; // Prevent concurrent fetch operations
    
    try {
      setIsLoadingShifts(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const formattedStartDate = firstDay.toISOString().split('T')[0];
      const formattedEndDate = lastDay.toISOString().split('T')[0];
      
      const shiftData = await shiftService.getShifts(formattedStartDate, formattedEndDate);
      setShifts(shiftData);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il caricamento dei turni.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingShifts(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchShiftsForCurrentMonth();
  }, [fetchShiftsForCurrentMonth]);

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
      setSelectedShift(null);
      setIsAddingShift(false);
      
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

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await shiftService.deleteShift(shiftId);
      setShifts(prev => prev.filter(s => s.id !== shiftId));
      toast({
        title: "Turno eliminato",
        description: "Il turno è stato eliminato con successo."
      });
      setSelectedShift(null);
      setIsAddingShift(false);
      
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

  const isLoading = isLoadingEmployees || isLoadingShifts;

  if (isLoadingEmployees) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <CalendarPageHeader 
        employees={employees}
        onEmployeeSelect={handleEmployeeClick}
      />
      
      <CalendarViewToggle 
        isWeekView={isWeekView}
        isVerticalView={isVerticalView}
        onViewChange={handleViewChange}
      />
      
      <CalendarContent 
        isWeekView={isWeekView}
        isVerticalView={isVerticalView}
        onViewChange={handleViewChange}
        currentDate={currentDate}
        employees={employees}
        templates={templates}
        onDateChange={setCurrentDate}
        shifts={shifts}
        isLoading={isLoading}
        onAddShift={handleAddShift}
        onEditShift={handleEditShift}
      />
      
      {isAssignmentModalOpen && selectedEmployee && (
        isMobile ? (
          <MobileShiftAssignmentModal
            isOpen={isAssignmentModalOpen}
            onClose={() => setIsAssignmentModalOpen(false)}
            employee={selectedEmployee}
            templates={templates}
            currentMonth={currentDate}
            onShiftsAdded={handleAssignmentComplete}
          />
        ) : (
          <ShiftAssignmentModal
            isOpen={isAssignmentModalOpen}
            onClose={() => setIsAssignmentModalOpen(false)}
            employee={selectedEmployee}
            templates={templates}
            currentMonth={currentDate}
            onShiftsAdded={handleAssignmentComplete}
          />
        )
      )}

      {isAssignmentModalOpen && !selectedEmployee && isMobile && (
        <MobileShiftAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          employee={employees.length > 0 ? employees[0] : null}
          templates={templates}
          currentMonth={currentDate}
          onShiftsAdded={handleAssignmentComplete}
        />
      )}

      {(isAddingShift || selectedShift) && (
        <ShiftModal 
          isOpen={isAddingShift || !!selectedShift} 
          onClose={() => {
            setSelectedShift(null);
            setIsAddingShift(false);
          }} 
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
