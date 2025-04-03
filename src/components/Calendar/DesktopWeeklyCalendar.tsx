
import { DAYS_OF_WEEK } from "@/lib/constants";
import { formatTime } from "@/lib/utils";
import { Employee, Shift } from "@/lib/types";

interface DesktopWeeklyCalendarProps {
  formattedDates: Array<{
    date: Date;
    dayOfMonth: number;
    isToday: boolean;
  }>;
  uniqueShiftTimes: string[];
  shiftsByDayAndTime: Record<number, Record<string, Shift[]>>;
  isAdmin: () => boolean;
  onAddShift: (date: Date, dayOfWeek: number) => void;
  onEditShift: (shift: Shift) => void;
  getEmployeeById: (id: string) => Employee | undefined;
  shouldHighlightShift: (shift: Shift) => boolean;
}

export function DesktopWeeklyCalendar({
  formattedDates,
  uniqueShiftTimes,
  shiftsByDayAndTime,
  isAdmin,
  onAddShift,
  onEditShift,
  getEmployeeById,
  shouldHighlightShift
}: DesktopWeeklyCalendarProps) {
  return (
    <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
      <div className="grid grid-cols-8 border-b border-border">
        <div className="py-2 text-center font-semibold text-sm border-r border-border">
          Orario
        </div>
        {DAYS_OF_WEEK.map((day, index) => (
          <div key={day} className="relative py-2 text-center font-semibold text-sm border-r last:border-r-0 border-border">
            <div>{day}</div>
            <div className={`mt-1 text-xs ${formattedDates[index].isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
              {formattedDates[index].dayOfMonth}
            </div>
            {formattedDates[index].isToday && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"></div>
            )}
          </div>
        ))}
      </div>
      
      <div className="divide-y divide-border">
        {uniqueShiftTimes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nessun turno pianificato per questa settimana.
          </div>
        ) : (
          uniqueShiftTimes.map(time => (
            <div key={time} className="grid grid-cols-8">
              <div className="p-2 text-xs font-medium text-card-foreground bg-secondary border-r border-border flex items-center justify-center">
                {formatTime(time)}
              </div>
              
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const isWeekend = dayIndex > 4;
                const shifts = shiftsByDayAndTime[dayIndex][time] || [];
                return (
                  <div 
                    key={dayIndex} 
                    className={`p-2 border-r last:border-r-0 border-border ${isWeekend ? "bg-secondary/30 dark:bg-secondary/10" : ""} min-h-[60px]`} 
                    onClick={() => {
                      if (isAdmin()) {
                        const date = new Date(formattedDates[dayIndex].date);
                        onAddShift(date, dayIndex);
                      }
                    }}
                  >
                    <div className="space-y-1">
                      {shifts.map(shift => {
                        const employee = getEmployeeById(shift.employeeId);
                        if (!employee) return null;
                        const isUserShift = shouldHighlightShift(shift);
                        const employeeColor = employee.color || "#9CA3AF";
                        const customStyle = {
                          backgroundColor: `${employeeColor}${isUserShift ? '40' : '20'}`,
                          color: employeeColor,
                          borderColor: `${employeeColor}${isUserShift ? '70' : '30'}`
                        };
                        
                        return (
                          <div 
                            key={shift.id} 
                            className={`px-2 py-1 rounded-md text-xs font-medium truncate border cursor-pointer ${isUserShift ? 'ring-1 ring-primary/30' : ''}`} 
                            style={customStyle} 
                            onClick={e => {
                              e.stopPropagation();
                              if (isAdmin()) {
                                onEditShift(shift);
                              }
                            }}
                          >
                            {employee.firstName} {employee.lastName.charAt(0)} {formatTime(shift.startTime)}-{formatTime(shift.endTime)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
