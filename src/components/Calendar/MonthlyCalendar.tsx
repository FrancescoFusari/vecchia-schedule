
import { useState } from "react";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  format, 
  isSameMonth, 
  isToday 
} from "date-fns";
import { it } from "date-fns/locale";
import { CalendarHeader } from "./CalendarHeader";
import CalendarDay from "./CalendarDay";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ShiftModal from "../Shifts/ShiftModal";
import { Employee, Shift, CalendarDay as CalendarDayType } from "@/lib/types";

interface MonthlyCalendarProps {
  currentDate: Date;
  shifts: Shift[];
  employees: Employee[];
  isAdmin: boolean;
}

export function MonthlyCalendar({ currentDate, shifts, employees, isAdmin }: MonthlyCalendarProps) {
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Generate calendar days for the current month view
  const getDaysInMonth = (date: Date): CalendarDayType[] => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: CalendarDayType[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: isSameMonth(currentDate, monthStart),
        isToday: isToday(currentDate),
        shifts: shifts.filter(shift => 
          shift.date === format(currentDate, 'yyyy-MM-dd')
        ),
      });
      currentDate = addDays(currentDate, 1);
    }

    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);

  // Group days by weeks for rendering
  const calendarWeeks: CalendarDayType[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    calendarWeeks.push(calendarDays.slice(i, i + 7));
  }

  // Handle adding a new shift
  const handleAddShift = (date: Date) => {
    setSelectedDate(date);
    setSelectedShift(null);
    setIsShiftModalOpen(true);
  };

  // Handle editing an existing shift
  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setSelectedDate(null);
    setIsShiftModalOpen(true);
  };

  return (
    <div className="space-y-2">
      <CalendarHeader />
      
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
        {calendarWeeks.map((week, weekIndex) => (
          week.map((day, dayIndex) => (
            <CalendarDay
              key={`${weekIndex}-${dayIndex}`}
              day={day}
              employees={employees}
              onAddShift={isAdmin ? handleAddShift : undefined}
              onEditShift={isAdmin ? handleEditShift : undefined}
            />
          ))
        ))}
      </div>

      {isAdmin && (
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={() => handleAddShift(new Date())}
            size="sm"
          >
            <Plus className="mr-1 h-4 w-4" />
            Nuovo Turno
          </Button>
        </div>
      )}

      {isShiftModalOpen && (
        <ShiftModal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          employees={employees}
          shift={selectedShift}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}

export default MonthlyCalendar;
