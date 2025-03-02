
import { useState, useEffect } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { formatDate, getWeekDates, formatMonthYear } from "@/lib/utils";
import { Shift, Employee } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { employeeService, shiftService } from "@/lib/supabase";
import { ShiftModal } from "../Shifts/ShiftModal";
import { HoursSummary } from "../Reports/HoursSummary";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export function WeeklyCalendar() {
  const { isAdmin, user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState<number | undefined>(undefined);
  const [weekDates, setWeekDates] = useState<{ start: Date; end: Date }>({ 
    start: new Date(), 
    end: new Date() 
  });
  
  // Use the mobile hook to determine if we're on a mobile device
  const isMobile = useIsMobile();
  
  // Check authentication
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Accesso richiesto",
        description: "Devi effettuare l'accesso per visualizzare il calendario.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, loading, navigate]);
  
  // Load data
  useEffect(() => {
    // Don't fetch data if not authenticated
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Get employees
        const employeeData = await employeeService.getEmployees();
        setEmployees(employeeData);
        
        // Get week dates
        const weekRange = getWeekDates(currentDate);
        setWeekDates(weekRange);
        
        // Format dates for API
        const formattedStartDate = formatDate(weekRange.start);
        const formattedEndDate = formatDate(weekRange.end);
        
        console.log(`Fetching shifts from ${formattedStartDate} to ${formattedEndDate}`);
        const shiftData = await shiftService.getShifts(formattedStartDate, formattedEndDate);
        setShifts(shiftData);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        setHasError(true);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante il caricamento dei dati del calendario.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentDate, user]);
  
  const handlePrevWeek = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setDate(date.getDate() - 7);
      return date;
    });
  };
  
  const handleNextWeek = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setDate(date.getDate() + 7);
      return date;
    });
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleAddShift = (date: Date, dayOfWeek: number) => {
    setSelectedDate(date);
    setCurrentDayOfWeek(dayOfWeek);
    setIsAddingShift(true);
    setSelectedShift(null);
  };
  
  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setIsAddingShift(false);
  };
  
  const handleShiftModalClose = () => {
    setSelectedShift(null);
    setIsAddingShift(false);
  };
  
  const handleSaveShift = async (shift: Shift) => {
    try {
      if (selectedShift) {
        // Update existing shift
        const updatedShift = await shiftService.updateShift(shift);
        setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
        toast({
          title: "Turno aggiornato",
          description: "Il turno è stato aggiornato con successo.",
        });
      } else {
        // Add new shift
        const newShift = await shiftService.createShift(shift);
        setShifts(prev => [...prev, newShift]);
        toast({
          title: "Turno aggiunto",
          description: "Il nuovo turno è stato aggiunto con successo.",
        });
      }
      
      handleShiftModalClose();
    } catch (error) {
      console.error("Error saving shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del turno. Assicurati di avere i permessi necessari.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteShift = async (shiftId: string) => {
    try {
      await shiftService.deleteShift(shiftId);
      setShifts(prev => prev.filter(s => s.id !== shiftId));
      toast({
        title: "Turno eliminato",
        description: "Il turno è stato eliminato con successo.",
      });
      handleShiftModalClose();
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del turno. Assicurati di avere i permessi necessari.",
        variant: "destructive",
      });
    }
  };
  
  // Get unique shift times to display on the left side
  const getUniqueShiftTimes = () => {
    const times = new Set<string>();
    shifts.forEach(shift => {
      times.add(shift.startTime);
    });
    return Array.from(times).sort();
  };
  
  const shiftTimes = getUniqueShiftTimes();
  
  // Group shifts by day and time
  const getShiftsByDayAndTime = () => {
    const shiftsByDay: Record<number, Record<string, Shift[]>> = {};
    
    // Initialize empty arrays for each day and shift time
    for (let day = 0; day < 7; day++) {
      shiftsByDay[day] = {};
      shiftTimes.forEach(time => {
        shiftsByDay[day][time] = [];
      });
    }
    
    // Populate with shifts
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      // Get day of week (0 = Monday, ..., 6 = Sunday)
      let dayOfWeek = shiftDate.getDay();
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (shiftsByDay[dayOfWeek][shift.startTime]) {
        shiftsByDay[dayOfWeek][shift.startTime].push(shift);
      }
    });
    
    return shiftsByDay;
  };
  
  const getEmployeeById = (id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  };
  
  // Get formatted dates for the week
  const getFormattedDates = () => {
    const dates = [];
    const start = new Date(weekDates.start);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push({
        date,
        dayOfMonth: date.getDate(),
        isToday: new Date().toDateString() === date.toDateString()
      });
    }
    
    return dates;
  };
  
  const formattedDates = getFormattedDates();
  const shiftsByDayAndTime = getShiftsByDayAndTime();
  
  // If loading auth, show loading indicator
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authenticated, don't render anything (will redirect in effect)
  if (!user) {
    return null;
  }
  
  // Render the desktop view (days horizontally, time vertically)
  const renderDesktopView = () => {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="py-2 text-center font-semibold text-sm border-r border-gray-200">
            Orario
          </div>
          {DAYS_OF_WEEK.map((day, index) => (
            <div key={day} className="relative py-2 text-center font-semibold text-sm border-r last:border-r-0 border-gray-200">
              <div>{day}</div>
              <div className={`mt-1 text-xs ${formattedDates[index].isToday ? "text-primary font-bold" : "text-gray-500"}`}>
                {formattedDates[index].dayOfMonth}
              </div>
              {formattedDates[index].isToday && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"></div>
              )}
            </div>
          ))}
        </div>
        
        {/* Time slots and shifts */}
        <div className="divide-y divide-gray-200">
          {shiftTimes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nessun turno pianificato per questa settimana.
            </div>
          ) : (
            shiftTimes.map(time => (
              <div key={time} className="grid grid-cols-8">
                {/* Time slot */}
                <div className="p-2 text-xs font-medium text-gray-700 bg-gray-50 border-r border-gray-200 flex items-center justify-center">
                  {time}
                </div>
                
                {/* Days */}
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const isWeekend = dayIndex > 4; // Friday and Saturday are weekend
                  const shifts = shiftsByDayAndTime[dayIndex][time] || [];
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`p-2 border-r last:border-r-0 border-gray-200 ${isWeekend ? "bg-amber-50/30" : ""} min-h-[60px]`}
                      onClick={() => {
                        if (isAdmin()) {
                          const date = new Date(formattedDates[dayIndex].date);
                          handleAddShift(date, dayIndex);
                        }
                      }}
                    >
                      <div className="space-y-1">
                        {shifts.map(shift => {
                          const employee = getEmployeeById(shift.employeeId);
                          if (!employee) return null;
                          
                          // Use employee color with fallback
                          const employeeColor = employee.color || "#9CA3AF";
                          
                          // Generate color styles based on employee color
                          const customStyle = {
                            backgroundColor: `${employeeColor}20`, // 20% opacity
                            color: employeeColor,
                            borderColor: `${employeeColor}30`, // 30% opacity
                          };
                          
                          return (
                            <div
                              key={shift.id}
                              className="px-2 py-1 rounded-md text-xs font-medium truncate border cursor-pointer"
                              style={customStyle}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAdmin()) {
                                  handleEditShift(shift);
                                }
                              }}
                            >
                              {employee.firstName} {employee.lastName.charAt(0)} {shift.startTime}-{shift.endTime}
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
  };
  
  // Render the mobile view (days vertically, time horizontally)
  const renderMobileView = () => {
    return (
      <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
        {DAYS_OF_WEEK.map((day, dayIndex) => {
          const isWeekend = dayIndex > 4; // Friday and Saturday are weekend
          const date = formattedDates[dayIndex];
          const isToday = date.isToday;
          
          return (
            <div key={day} className={`mb-6 ${isWeekend ? "bg-amber-50/10" : ""}`}>
              {/* Day header */}
              <div className={`sticky left-0 p-3 font-semibold flex items-center justify-between border-b ${isToday ? "bg-blue-50" : "bg-gray-50"} border-gray-200`}>
                <div className="flex items-center gap-2">
                  {isToday && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                  <span>{day}</span>
                  <span className={`text-sm ${isToday ? "text-primary font-bold" : "text-gray-500"}`}>
                    {date.dayOfMonth}
                  </span>
                </div>
                {isAdmin() && (
                  <button 
                    className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                    onClick={() => handleAddShift(date.date, dayIndex)}
                  >
                    + Turno
                  </button>
                )}
              </div>
              
              {/* Time slots for this day */}
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Time headers */}
                  <div className="grid grid-cols-12 text-center text-xs border-b border-gray-200">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const hour = i + 8; // Starting at 8 AM
                      return (
                        <div key={i} className="p-1 border-r border-gray-200 last:border-r-0">
                          {hour}:00
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Shifts for this day */}
                  <div className="relative h-12 border-b border-gray-200">
                    {shifts
                      .filter(shift => {
                        const shiftDate = new Date(shift.date);
                        let shiftDayOfWeek = shiftDate.getDay();
                        shiftDayOfWeek = shiftDayOfWeek === 0 ? 6 : shiftDayOfWeek - 1;
                        return shiftDayOfWeek === dayIndex;
                      })
                      .map(shift => {
                        const employee = getEmployeeById(shift.employeeId);
                        if (!employee) return null;
                        
                        // Calculate position and width based on start and end time
                        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
                        const [endHour, endMinute] = shift.endTime.split(':').map(Number);
                        
                        // Calculate position as percentage (assuming 8:00 AM is 0% and 8:00 PM is 100%)
                        const startPosition = ((startHour - 8) * 60 + startMinute) / (12 * 60) * 100;
                        const endPosition = ((endHour - 8) * 60 + endMinute) / (12 * 60) * 100;
                        const width = endPosition - startPosition;
                        
                        // Skip shifts outside our time range (8 AM - 8 PM)
                        if (startHour < 8 || startHour >= 20) return null;
                        
                        // Use employee color with fallback
                        const employeeColor = employee.color || "#9CA3AF";
                        
                        // Generate color styles based on employee color
                        const customStyle = {
                          left: `${startPosition}%`,
                          width: `${width}%`,
                          backgroundColor: `${employeeColor}20`, // 20% opacity
                          color: employeeColor,
                          borderColor: employeeColor,
                        };
                        
                        return (
                          <div
                            key={shift.id}
                            className="absolute h-10 top-1 text-xs border-l-2 rounded-r-sm px-1 flex items-center overflow-hidden whitespace-nowrap cursor-pointer"
                            style={customStyle}
                            onClick={() => {
                              if (isAdmin()) {
                                handleEditShift(shift);
                              }
                            }}
                          >
                            <div className="truncate">
                              {employee.firstName} {employee.lastName.charAt(0)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Calendar header with navigation */}
      <CalendarHeader
        date={currentDate}
        onPrevMonth={handlePrevWeek}
        onNextMonth={handleNextWeek}
        onToday={handleToday}
        isWeekView={true}
      />
      
      {/* Admin information banner */}
      {isAdmin() && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm">
          <strong>Modalità Admin:</strong> Puoi aggiungere, modificare ed eliminare i turni cliccando sulle celle.
        </div>
      )}
      
      {/* Error banner */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-800 text-sm">
          Si è verificato un errore durante il caricamento dei dati. Prova ad aggiornare la pagina.
        </div>
      )}
      
      {/* Weekly view - responsive layout */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Show desktop or mobile view based on screen size */}
          <div className="hidden md:block">
            {renderDesktopView()}
          </div>
          <div className="block md:hidden">
            {renderMobileView()}
          </div>
        </>
      )}
      
      {/* Hours summary */}
      <HoursSummary
        shifts={shifts}
        employees={employees}
        currentDate={currentDate}
      />
      
      {/* Shift modal for adding/editing shifts */}
      {(isAddingShift || selectedShift) && (
        <ShiftModal
          isOpen={isAddingShift || !!selectedShift}
          onClose={handleShiftModalClose}
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
}
