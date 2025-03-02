
import { CalendarDay as CalendarDayType, Employee, Shift } from "@/lib/types";
import { ShiftItem } from "./ShiftItem";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CalendarDayProps {
  day: CalendarDayType;
  employees: Employee[];
  timeSlots: string[];
  onAddShift?: (date: Date, dayOfWeek: number) => void;
  onEditShift?: (shift: Shift) => void;
}

export function CalendarDay({ day, employees, timeSlots, onAddShift, onEditShift }: CalendarDayProps) {
  const { isAdmin } = useAuth();
  
  const getEmployeeById = (id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  };
  
  // Create a new Date object with the time set to noon to avoid timezone issues
  const handleAddShift = () => {
    if (onAddShift) {
      const localDate = new Date(day.date);
      // Set to noon to avoid timezone issues
      localDate.setHours(12, 0, 0, 0);
      
      // Get day of week (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
      let dayOfWeek = localDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0 = Monday, ..., 6 = Sunday
      
      console.log(`Adding shift for date: ${formatDate(localDate)}, day of week: ${dayOfWeek}`);
      onAddShift(localDate, dayOfWeek);
    }
  };
  
  // Group shifts by time slot
  const getShiftsByTimeSlot = (timeSlot: string) => {
    return day.shifts.filter(shift => shift.startTime === timeSlot);
  };
  
  // Check if it's a weekend day (Saturday or Sunday)
  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
  
  return (
    <div className="flex flex-col">
      {/* Day number header */}
      <div 
        className={cn(
          "h-10 flex justify-between items-center p-2 sticky top-0 border-b border-gray-200",
          !day.isCurrentMonth && "bg-gray-50 text-gray-400",
          day.isToday && "border-primary/50"
        )}
      >
        <div
          className={cn(
            "font-semibold text-sm rounded-full w-7 h-7 flex items-center justify-center",
            day.isToday && "bg-primary text-white"
          )}
        >
          {day.date.getDate()}
        </div>
        
        {isAdmin() && day.isCurrentMonth && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full opacity-60 hover:opacity-100 bg-gray-100"
                  onClick={handleAddShift}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aggiungi turno</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Time slot cells */}
      {timeSlots.map((timeSlot, index) => {
        const shiftsInSlot = getShiftsByTimeSlot(timeSlot);
        
        return (
          <div 
            key={index} 
            className={cn(
              "calendar-day-slot h-24 border-b border-r border-gray-200 p-1 overflow-y-auto",
              !day.isCurrentMonth && "bg-gray-50"
            )}
          >
            {shiftsInSlot.length === 0 && day.isCurrentMonth ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                {/* Empty state - show nothing or a subtle indicator */}
              </div>
            ) : (
              <div className="space-y-1">
                {shiftsInSlot.map(shift => {
                  const employee = getEmployeeById(shift.employeeId);
                  if (!employee) return null;
                  
                  return (
                    <ShiftItem
                      key={shift.id}
                      shift={shift}
                      employee={employee}
                      isWeekend={isWeekend}
                      onClick={() => onEditShift?.(shift)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
