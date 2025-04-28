import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Employee } from "@/lib/types";
import { ShiftAssignmentModal } from "@/components/Shifts/ShiftAssignmentModal";
import { MobileShiftAssignmentModal } from "@/components/Shifts/MobileShiftAssignmentModal";
import { ShiftModal } from "@/components/Shifts/ShiftModal";
import { useCalendarState } from "@/hooks/useCalendarState";
import { CalendarViewToggle } from "@/components/Calendar/CalendarViewToggle";
import { CalendarContent } from "@/components/Calendar/CalendarContent";
import { CalendarPageHeader } from "@/components/Calendar/CalendarPageHeader";

const Calendar = () => {
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const [isWeekView, setIsWeekView] = useState(false);
  const [isVerticalView, setIsVerticalView] = useState(isMobile);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedShift, setSelectedShift] = useState(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState<number | undefined>(undefined);

  const { employees, templates, isLoading } = useCalendarState();

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

  if (isLoading) {
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
