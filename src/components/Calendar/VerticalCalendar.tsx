import { useState, useEffect, useRef } from "react";
import { Shift, Employee, ShiftTemplate } from "@/lib/types";
import { formatDate, formatEmployeeName, formatMonthYear, cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Filter, User, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShiftItem } from "./ShiftItem";
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
}

interface DayWithShifts {
  date: Date;
  dayOfWeek: number;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  shifts: Shift[];
}

export function VerticalCalendar({
  shifts,
  employees,
  templates,
  currentDate,
  onDateChange,
  isLoading,
  onAddShift,
  onEditShift
}: VerticalCalendarProps) {
  const { user, isAdmin } = useAuth();
  const [showOnlyUserShifts, setShowOnlyUserShifts] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [daysWithShifts, setDaysWithShifts] = useState<DayWithShifts[]>([]);
  const [filteredDays, setFilteredDays] = useState<DayWithShifts[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isMobile = useIsMobile();
  const listRef = useRef<HTMLDivElement>(null);

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
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
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
        shifts: dayShifts
      });
    }
    
    setDaysWithShifts(days);
  }, [currentDate, shifts]);

  useEffect(() => {
    let filtered = [...daysWithShifts];
    
    if (showOnlyUserShifts && user) {
      const userEmployee = employees.find(emp => emp.userId === user.id);
      if (userEmployee) {
        filtered = filtered.map(day => ({
          ...day,
          shifts: day.shifts.filter(shift => shift.employeeId === userEmployee.id)
        })).filter(day => day.shifts.length > 0);
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

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

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
    setShowOnlyUserShifts(false);
    setSelectedTemplate("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium capitalize">{formatMonthYear(currentDate)}</h3>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Oggi
          </Button>
          
          {!isAdmin() && (
            <Toggle
              pressed={showOnlyUserShifts}
              onPressedChange={setShowOnlyUserShifts}
              className="relative"
              aria-label="Mostra solo i miei turni"
            >
              <User className="h-4 w-4" />
              {showOnlyUserShifts && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </Toggle>
          )}
          
          {isAdmin() && (
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Filter className="h-4 w-4" />
                  {(showOnlyUserShifts || selectedTemplate) && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtri Turni</SheetTitle>
                  <SheetDescription>
                    Filtra i turni per visualizzare solo quelli di interesse
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="show-user-shifts">Solo miei turni</Label>
                      <span className="text-sm text-muted-foreground">
                        Mostra solo i tuoi turni programmati
                      </span>
                    </div>
                    <Switch 
                      id="show-user-shifts" 
                      checked={showOnlyUserShifts}
                      onCheckedChange={setShowOnlyUserShifts}
                    />
                  </div>
                  
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
                    disabled={!showOnlyUserShifts && !selectedTemplate}
                  >
                    Cancella filtri
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredDays.length === 0 ? (
        <div className="bg-muted/20 p-6 rounded-md text-center">
          <p className="text-muted-foreground">
            {(showOnlyUserShifts || selectedTemplate) ? 
              "Nessun turno corrisponde ai filtri selezionati" : 
              "Nessun turno programmato per questo mese"}
          </p>
          {(showOnlyUserShifts || selectedTemplate) && (
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
        <div className="space-y-3" ref={listRef}>
          {filteredDays.map((day) => (
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
                      />
                    );
                  })}
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
