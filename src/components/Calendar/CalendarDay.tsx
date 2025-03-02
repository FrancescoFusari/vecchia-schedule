
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ShiftItem from "./ShiftItem";
import { CalendarDay as CalendarDayType, Employee, Shift } from "@/lib/types";

interface CalendarDayProps {
  day: CalendarDayType;
  employees: Employee[];
  onAddShift?: (date: Date) => void;
  onEditShift?: (shift: Shift) => void;
}

export function CalendarDay({ day, employees, onAddShift, onEditShift }: CalendarDayProps) {
  const { date, isCurrentMonth, isToday, shifts } = day;

  // Find employee names for each shift
  const shiftsWithEmployees = shifts.map(shift => {
    const employee = employees.find(emp => emp.id === shift.employeeId);
    return {
      ...shift,
      employeeName: employee 
        ? `${employee.firstName} ${employee.lastName.charAt(0)}`
        : 'Sconosciuto'
    };
  });

  return (
    <div
      className={`min-h-[120px] p-1 bg-white border-b border-r ${
        !isCurrentMonth ? "bg-gray-50" : ""
      } ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
    >
      <div className="flex justify-between items-start">
        <span
          className={`text-sm font-medium ${
            isToday ? "text-primary" : !isCurrentMonth ? "text-gray-400" : ""
          }`}
        >
          {format(date, "d")}
        </span>
        
        {onAddShift && isCurrentMonth && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => onAddShift(date)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {shifts.length > 0 && (
        <ScrollArea className="h-[80px] mt-1">
          <div className="space-y-1">
            {shiftsWithEmployees.map((shift) => (
              <ShiftItem
                key={shift.id}
                shift={shift}
                employeeName={shift.employeeName}
                onClick={() => onEditShift && onEditShift(shift)}
                isClickable={!!onEditShift}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default CalendarDay;
