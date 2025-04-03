
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Shift, Employee } from "@/lib/types";
import { ShiftItem } from "./ShiftItem";
import { MobileCalendarNavigation } from "./MobileCalendarNavigation";

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
  onPrevDays: () => void;
  onNextDays: () => void;
  isAdmin: () => boolean;
  getEmployeeById: (id: string) => Employee | undefined;
  shouldHighlightShift: (shift: Shift) => boolean;
}

export function MobileWeeklyCalendar({
  visibleDays,
  formattedDates,
  shiftsByDay,
  onAddShift,
  onEditShift,
  onPrevDays,
  onNextDays,
  isAdmin,
  getEmployeeById,
  shouldHighlightShift
}: MobileWeeklyCalendarProps) {
  return (
    <div className="bg-card rounded-lg shadow overflow-hidden border border-border divide-y divide-border">
      <MobileCalendarNavigation 
        visibleDays={visibleDays}
        formattedDates={formattedDates}
        onPrevDays={onPrevDays}
        onNextDays={onNextDays}
      />
      
      {visibleDays.map(dayIndex => {
        const day = DAYS_OF_WEEK[dayIndex];
        const isWeekend = dayIndex > 4;
        const shifts = shiftsByDay[dayIndex] || [];
        const formattedDate = formattedDates[dayIndex];
        const isToday = formattedDate.isToday;
        
        return (
          <div key={day} className={`${isWeekend ? "bg-secondary/30 dark:bg-secondary/10" : ""}`}>
            <div 
              className={`px-4 py-3 flex justify-between items-center ${isToday ? "bg-primary/10" : ""}`} 
              onClick={() => {
                if (isAdmin()) {
                  const date = new Date(formattedDates[dayIndex].date);
                  onAddShift(date, dayIndex);
                }
              }}
            >
              <div className="flex items-center">
                <div className={`font-semibold ${isToday ? "text-primary" : ""}`}>
                  {day} {formattedDate.dayOfMonth}
                </div>
              </div>
              {isAdmin() && (
                <button 
                  className="text-xs bg-secondary hover:bg-secondary/80 dark:bg-secondary/40 dark:hover:bg-secondary/60 px-2 py-1 rounded text-foreground" 
                  onClick={e => {
                    e.stopPropagation();
                    const date = new Date(formattedDates[dayIndex].date);
                    onAddShift(date, dayIndex);
                  }}
                >
                  + Turno
                </button>
              )}
            </div>
            
            <div className="px-4 py-2 space-y-2">
              {shifts.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">Nessun turno</div>
              ) : (
                shifts.map(shift => {
                  const employee = getEmployeeById(shift.employeeId);
                  if (!employee) return null;
                  const isUserShift = shouldHighlightShift(shift);
                  
                  return (
                    <ShiftItem 
                      key={shift.id} 
                      shift={shift}
                      employee={employee}
                      onClick={isAdmin() ? () => onEditShift(shift) : undefined}
                      highlight={isUserShift}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
