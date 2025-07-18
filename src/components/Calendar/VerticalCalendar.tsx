import { useState, useEffect, useRef } from "react";
import { Shift, Employee, ShiftTemplate } from "@/lib/types";
import { formatDate, formatEmployeeName, formatMonthYear, cn } from "@/lib/utils";
import { Filter, User, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShiftItem } from "./ShiftItem";
import { FreeDayIndicator } from "./FreeDayIndicator";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface VerticalCalendarProps {
  shifts: Shift[];
  employees: Employee[];
  templates: ShiftTemplate[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isLoading: boolean;
  onAddShift: (date: Date, dayOfWeek: number) => void;
  onEditShift: (shift: Shift) => void;
  showOnlyUserShifts?: boolean;
}

interface DayWithShifts {
  date: Date;
  dayOfWeek: number;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  shifts: Shift[];
  isCurrentMonth: boolean;
  isFreeDay?: boolean;
}

export function VerticalCalendar({
  shifts,
  employees,
  templates,
  currentDate,
  onDateChange,
  isLoading,
  onAddShift,
  onEditShift,
  showOnlyUserShifts = false
}: VerticalCalendarProps) {
  const { user, isAdmin } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [daysWithShifts, setDaysWithShifts] = useState<DayWithShifts[]>([]);
  const [filteredDays, setFilteredDays] = useState<DayWithShifts[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isMobile = useIsMobile();
  const listRef = useRef<HTMLDivElement>(null);
  const [currentUserEmployee, setCurrentUserEmployee] = useState<Employee | null>(null);

  // Find the current user's employee record
  useEffect(() => {
    if (user && employees.length > 0) {
      const userEmployee = employees.find(emp => emp.userId === user.id);
      setCurrentUserEmployee(userEmployee || null);
    }
  }, [user, employees]);

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1));
    
    const endDate = new Date(lastDay);
    const daysToAdd = 7 - endDate.getDay();
    endDate.setDate(endDate.getDate() + (daysToAdd === 7 ? 0 : daysToAdd));

    console.log(`Date range for shifts: ${formatDate(startDate)} to ${formatDate(endDate)}`);
    
    const days: DayWithShifts[] = [];
    const today = new Date();
    
    const currentMonthStartDate = new Date(year, month, 1);
    const currentMonthLastDate = new Date(year, month + 1, 0);
    
    for (let d = 1; d <= currentMonthLastDate.getDate(); d++) {
      const date = new Date(year, month, d);
      let dayOfWeek = date.getDay();
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const dayShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return (
          shiftDate.getDate() === date.getDate() &&
          shiftDate.getMonth() === date.getMonth() &&
          shiftDate.getFullYear() === date.getFullYear()
        );
      });
      
      console.log(`Day ${formatDate(date)} has ${dayShifts.length} shifts`);
      
      days.push({
        date,
        dayOfWeek,
        dayName: DAYS_OF_WEEK[dayOfWeek],
        dayNumber: date.getDate().toString(),
        isToday: 
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        shifts: dayShifts,
        isCurrentMonth: true
      });
    }
    
    setDaysWithShifts(days);
  }, [currentDate, shifts]);

  useEffect(() => {
    let filtered = [...daysWithShifts];
    
    if (showOnlyUserShifts && user) {
      const userEmployee = employees.find(emp => emp.userId === user.id);
      if (userEmployee) {
        // Mark days as "free" when there are no shifts for the user
        filtered = filtered.map(day => {
          const userShifts = day.shifts.filter(shift => shift.employeeId === userEmployee.id);
          return {
            ...day,
            shifts: userShifts,
            isFreeDay: userShifts.length === 0 && day.isCurrentMonth
          };
        });
        // We keep all days but mark free ones - not filtering them out anymore
      }
    }
    
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        filtered = filtered.map(day => ({
          ...day,
          shifts: day.shifts.filter(shift => 
            shift.startTime === template.startTime && 
            shift.endTime === template.endTime
          )
        })).filter(day => day.shifts.length > 0);
      }
    }
    
    setFilteredDays(filtered);
  }, [daysWithShifts, showOnlyUserShifts, selectedTemplate, user, employees, templates]);

  useEffect(() => {
    if (isMobile && listRef.current) {
      const todayElement = listRef.current.querySelector('[data-today="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [filteredDays, isMobile]);

  const getEmployeeById = (id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  };

  const shouldHighlightShift = (shift: Shift) => {
    if (!user) return false;
    const userEmployee = employees.find(emp => emp.userId === user.id);
    if (!userEmployee) return false;
    return shift.employeeId === userEmployee.id;
  };

  const clearFilters = () => {
    setSelectedTemplate("");
  };

  // Filter days to only display current month
  const currentMonthDays = filteredDays.filter(day => day.isCurrentMonth);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {isAdmin() && (
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {selectedTemplate && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtri Turni</SheetTitle>
                <SheetDescription>
                  Filtra i turni per tipo di turno
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="template-filter">Tipo di turno</Label>
                  <Select 
                    value={selectedTemplate} 
                    onValueChange={setSelectedTemplate}
                  >
                    <SelectTrigger id="template-filter">
                      <SelectValue placeholder="Tutti i tipi di turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutti i tipi</SelectItem>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.startTime}-{template.endTime})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="w-full"
                  disabled={!selectedTemplate}
                >
                  Cancella filtri
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : currentMonthDays.length === 0 ? (
        <div className="bg-muted/20 p-6 rounded-md text-center">
          <p className="text-muted-foreground">
            {(showOnlyUserShifts || selectedTemplate) ? 
              "Nessun turno corrisponde ai filtri selezionati" : 
              "Nessun turno programmato per questo mese"}
          </p>
          {selectedTemplate && (
            <Button 
              variant="link" 
              onClick={clearFilters} 
              className="mt-2"
            >
              Cancella filtri
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in duration-300" ref={listRef}>
          {currentMonthDays.map((day) => (
            <div 
              key={day.date.toISOString()} 
              data-today={day.isToday}
              className={cn(
                "py-2 px-1",
                day.isToday ? "bg-primary/5 rounded-md" : ""
              )}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={day.isToday ? "default" : "outline"} 
                    className={cn(
                      "text-xs font-normal capitalize",
                      day.isToday ? "" : "bg-muted/20"
                    )}
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {day.dayName} {day.dayNumber}
                  </Badge>
                </div>
                {isAdmin() && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={() => onAddShift(day.date, day.dayOfWeek)}
                  >
                    + Aggiungi
                  </Button>
                )}
              </div>
              
              {day.shifts.length > 0 ? (
                <div className="space-y-1.5 pl-1">
                  {day.shifts.map((shift) => {
                    const employee = getEmployeeById(shift.employeeId);
                    if (!employee) return null;
                    
                    return (
                      <ShiftItem 
                        key={shift.id} 
                        shift={shift} 
                        employee={employee}
                        onClick={() => onEditShift(shift)}
                        highlight={shouldHighlightShift(shift)}
                        isFilterActive={showOnlyUserShifts}
                      />
                    );
                  })}
                </div>
              ) : day.isFreeDay ? (
                <div className="px-1 animate-in slide-in-from-top-2 duration-300">
                  <FreeDayIndicator date={day.date} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pl-1 py-1">Nessun turno programmato</p>
              )}
              
              <Separator className="mt-3" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
