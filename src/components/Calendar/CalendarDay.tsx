
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
  onAddShift?: (date: Date) => void;
  onEditShift?: (shift: Shift) => void;
}

export function CalendarDay({ day, employees, onAddShift, onEditShift }: CalendarDayProps) {
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
      console.log(`Adding shift for date: ${formatDate(localDate)}`);
      onAddShift(localDate);
    }
  };
  
  return (
    <div
      className={cn(
        "calendar-day border border-gray-200 p-2 transition-all duration-200 overflow-hidden h-full min-h-[120px]",
        !day.isCurrentMonth && "empty text-gray-400 bg-gray-50",
        day.isToday && "border-primary/50"
      )}
    >
      <div className="flex justify-between items-start">
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
      
      <div className="mt-2 space-y-1 max-h-[250px] overflow-y-auto">
        {day.shifts.length === 0 && day.isCurrentMonth && (
          <div className="text-xs text-gray-400 italic py-1">
            Nessun turno
          </div>
        )}
        
        {day.shifts.map(shift => {
          const employee = getEmployeeById(shift.employeeId);
          if (!employee) return null;
          
          return (
            <ShiftItem
              key={shift.id}
              shift={shift}
              employee={employee}
              onClick={() => onEditShift?.(shift)}
            />
          );
        })}
      </div>
    </div>
  );
}
