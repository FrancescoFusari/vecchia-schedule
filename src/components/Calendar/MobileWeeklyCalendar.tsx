
import { ShiftItem } from "./ShiftItem";
import { Button } from "@/components/ui/button";
import { MobileCalendarNavigation } from "./MobileCalendarNavigation";
import { Shift, Employee } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MobileWeeklyCalendarProps {
  visibleDays: number[];
  formattedDates: Array<{
    date: Date;
    dayOfMonth: number;
    isToday: boolean;
  }>;
  shiftsByDay: Record<number, Shift[]>;
  onAddShift: (date: Date, dayOfWeek: number) => void;
  onEditShift: (shift: Shift) => void;
  onLoadMoreDays: (direction: 'prev' | 'next') => void;
  isAdmin: () => boolean;
  getEmployeeById: (id: string) => Employee | undefined;
  shouldHighlightShift: (shift: Shift) => boolean;
  isAtMonthStart: boolean;
  isAtMonthEnd: boolean;
  onSwitchToVertical?: () => void;
}

export function MobileWeeklyCalendar({
  visibleDays,
  formattedDates,
  shiftsByDay,
  onAddShift,
  onEditShift,
  onLoadMoreDays,
  isAdmin,
  getEmployeeById,
  shouldHighlightShift,
  isAtMonthStart,
  isAtMonthEnd,
  onSwitchToVertical
}: MobileWeeklyCalendarProps) {
  const navigate = useNavigate();
  
  return (
    <div className="animate-in fade-in-50 duration-300">
      <MobileCalendarNavigation 
        visibleDays={visibleDays}
        formattedDates={formattedDates}
        onLoadMoreDays={onLoadMoreDays}
        isAtMonthStart={isAtMonthStart}
        isAtMonthEnd={isAtMonthEnd}
        onSwitchToVertical={onSwitchToVertical}
      />
      
      <div className="divide-y divide-border">
        {visibleDays.map(dayIndex => {
          if (!formattedDates[dayIndex]) return null;
          
          const date = formattedDates[dayIndex].date;
          const isToday = formattedDates[dayIndex].isToday;
          const shifts = shiftsByDay[dayIndex] || [];
          
          return (
            <div key={dayIndex} className={cn(
              "py-3 px-4",
              isToday ? "bg-primary/5" : ""
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className={cn(
                    "text-sm font-medium", 
                    isToday ? "text-primary" : ""
                  )}>
                    {date.toLocaleDateString('it', { weekday: 'long' })}
                  </span>
                  <span className={cn(
                    "ml-2 text-sm", 
                    isToday ? "font-bold text-primary" : "text-muted-foreground"
                  )}>
                    {date.getDate()}
                  </span>
                </div>
                
                {isAdmin() && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => onAddShift(date, dayIndex)}
                  >
                    + Turno
                  </Button>
                )}
              </div>
              
              {shifts.length > 0 ? (
                <div>
                  {shifts.map(shift => {
                    const employee = getEmployeeById(shift.employeeId);
                    if (!employee) return null;
                    
                    return (
                      <ShiftItem 
                        key={shift.id}
                        shift={shift} 
                        employee={employee} 
                        onClick={() => onEditShift(shift)}
                        highlight={shouldHighlightShift(shift)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-2">
                  Nessun turno pianificato
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
