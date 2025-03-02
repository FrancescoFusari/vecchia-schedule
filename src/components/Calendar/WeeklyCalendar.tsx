import { useState, useEffect } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { formatDate, getWeekDates, formatMonthYear, formatTime } from "@/lib/utils";
import { Shift, Employee } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { employeeService, shiftService } from "@/lib/supabase";
import { ShiftModal } from "../Shifts/ShiftModal";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { HoursSummary } from "../Reports/HoursSummary";

interface WeeklyCalendarProps {
  onViewChange?: (isWeekView: boolean) => void;
}

export function WeeklyCalendar({
  onViewChange
}: WeeklyCalendarProps) {
  const {
    isAdmin,
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState<number | undefined>(undefined);
  const [weekDates, setWeekDates] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(),
    end: new Date()
  });

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Accesso richiesto",
        description: "Devi effettuare l'accesso per visualizzare il calendario.",
        variant: "destructive"
      });
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const employeeData = await employeeService.getEmployees();
        setEmployees(employeeData);

        const weekRange = getWeekDates(currentDate);
        setWeekDates(weekRange);

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
          variant: "destructive"
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
        const updatedShift = await shiftService.updateShift(shift);
        setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
        toast({
          title: "Turno aggiornato",
          description: "Il turno è stato aggiornato con successo."
        });
      } else {
        const newShift = await shiftService.createShift(shift);
        setShifts(prev => [...prev, newShift]);
        toast({
          title: "Turno aggiunto",
          description: "Il nuovo turno è stato aggiunto con successo."
        });
      }
      handleShiftModalClose();
    } catch (error) {
      console.error("Error saving shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del turno. Assicurati di avere i permessi necessari.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await shiftService.deleteShift(shiftId);
      setShifts(prev => prev.filter(s => s.id !== shiftId));
      toast({
        title: "Turno eliminato",
        description: "Il turno è stato eliminato con successo."
      });
      handleShiftModalClose();
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del turno. Assicurati di avere i permessi necessari.",
        variant: "destructive"
      });
    }
  };

  const getUniqueShiftTimes = () => {
    const times = new Set<string>();
    shifts.forEach(shift => {
      times.add(shift.startTime);
    });
    return Array.from(times).sort();
  };

  const handleViewToggle = (isWeekView: boolean) => {
    if (onViewChange) {
      onViewChange(isWeekView);
    }
  };

  const getShiftsByDayAndTime = () => {
    const shiftsByDay: Record<number, Record<string, Shift[]>> = {};

    for (let day = 0; day < 7; day++) {
      shiftsByDay[day] = {};
      getUniqueShiftTimes().forEach(time => {
        shiftsByDay[day][time] = [];
      });
    }

    shifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      let dayOfWeek = shiftDate.getDay();
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      if (shiftsByDay[dayOfWeek][shift.startTime]) {
        shiftsByDay[dayOfWeek][shift.startTime].push(shift);
      }
    });
    return shiftsByDay;
  };

  const getShiftsByDay = () => {
    const shiftsByDay: Record<number, Shift[]> = {};

    for (let day = 0; day < 7; day++) {
      shiftsByDay[day] = [];
    }

    shifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      let dayOfWeek = shiftDate.getDay();
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      shiftsByDay[dayOfWeek].push(shift);
    });

    for (let day = 0; day < 7; day++) {
      shiftsByDay[day].sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
    }
    return shiftsByDay;
  };

  const getEmployeeById = (id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  };

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
  const shiftsByDay = getShiftsByDay();

  if (loading) {
    return <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }

  if (!user) {
    return null;
  }

  return <div className="space-y-6 animate-fade-in">
      <CalendarHeader date={currentDate} onPrevMonth={handlePrevWeek} onNextMonth={handleNextWeek} onToday={handleToday} isWeekView={true} onViewChange={handleViewToggle} />
      
      {isAdmin()}
      
      {hasError && <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-800 text-sm">
          Si è verificato un errore durante il caricamento dei dati. Prova ad aggiornare la pagina.
        </div>}
      
      {isLoading ? <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div> : <>
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <div className="grid grid-cols-8 border-b border-gray-200">
                <div className="py-2 text-center font-semibold text-sm border-r border-gray-200">
                  Orario
                </div>
                {DAYS_OF_WEEK.map((day, index) => <div key={day} className="relative py-2 text-center font-semibold text-sm border-r last:border-r-0 border-gray-200">
                    <div>{day}</div>
                    <div className={`mt-1 text-xs ${formattedDates[index].isToday ? "text-primary font-bold" : "text-gray-500"}`}>
                      {formattedDates[index].dayOfMonth}
                    </div>
                    {formattedDates[index].isToday && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"></div>}
                  </div>)}
              </div>
              
              <div className="divide-y divide-gray-200">
                {getUniqueShiftTimes().length === 0 ? <div className="text-center py-8 text-gray-500">
                    Nessun turno pianificato per questa settimana.
                  </div> : getUniqueShiftTimes().map(time => <div key={time} className="grid grid-cols-8">
                      <div className="p-2 text-xs font-medium text-gray-700 bg-gray-50 border-r border-gray-200 flex items-center justify-center">
                        {formatTime(time)}
                      </div>
                      
                      {Array.from({
              length: 7
            }).map((_, dayIndex) => {
              const isWeekend = dayIndex > 4;
              const shifts = shiftsByDayAndTime[dayIndex][time] || [];
              return <div key={dayIndex} className={`p-2 border-r last:border-r-0 border-gray-200 ${isWeekend ? "bg-amber-50/30" : ""} min-h-[60px]`} onClick={() => {
                if (isAdmin()) {
                  const date = new Date(formattedDates[dayIndex].date);
                  handleAddShift(date, dayIndex);
                }
              }}>
                            <div className="space-y-1">
                              {shifts.map(shift => {
                    const employee = getEmployeeById(shift.employeeId);
                    if (!employee) return null;

                    const employeeColor = employee.color || "#9CA3AF";

                    const customStyle = {
                      backgroundColor: `${employeeColor}20`,
                      color: employeeColor,
                      borderColor: `${employeeColor}30`
                    };
                    return <div key={shift.id} className="px-2 py-1 rounded-md text-xs font-medium truncate border cursor-pointer" style={customStyle} onClick={e => {
                      e.stopPropagation();
                      if (isAdmin()) {
                        handleEditShift(shift);
                      }
                    }}>
                                    {employee.firstName} {employee.lastName.charAt(0)} {formatTime(shift.startTime)}-{formatTime(shift.endTime)}
                                  </div>;
                  })}
                            </div>
                          </div>;
            })}
                    </div>)}
              </div>
            </div>}
          
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 divide-y divide-gray-200">
              {DAYS_OF_WEEK.map((day, dayIndex) => {
          const isWeekend = dayIndex > 4;
          const shifts = shiftsByDay[dayIndex] || [];
          const formattedDate = formattedDates[dayIndex];
          const isToday = formattedDate.isToday;
          return <div key={day} className={`${isWeekend ? "bg-amber-50/30" : ""}`}>
                    <div className={`px-4 py-3 flex justify-between items-center ${isToday ? "bg-primary/10" : ""}`} onClick={() => {
              if (isAdmin()) {
                const date = new Date(formattedDates[dayIndex].date);
                handleAddShift(date, dayIndex);
              }
            }}>
                      <div className="flex items-center">
                        <div className={`font-semibold ${isToday ? "text-primary" : ""}`}>
                          {day} {formattedDate.dayOfMonth}
                        </div>
                      </div>
                      {isAdmin() && <button className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700" onClick={e => {
                e.stopPropagation();
                const date = new Date(formattedDates[dayIndex].date);
                handleAddShift(date, dayIndex);
              }}>
                          + Turno
                        </button>}
                    </div>
                    
                    <div className="px-4 py-2 space-y-2">
                      {shifts.length === 0 ? <div className="text-sm text-gray-500 py-2">Nessun turno</div> : shifts.map(shift => {
                const employee = getEmployeeById(shift.employeeId);
                if (!employee) return null;

                const employeeColor = employee.color || "#9CA3AF";

                const customStyle = {
                  backgroundColor: `${employeeColor}20`,
                  color: employeeColor,
                  borderColor: `${employeeColor}30`
                };
                return <div key={shift.id} className="px-3 py-2 rounded-md text-sm font-medium border flex justify-between" style={customStyle} onClick={() => {
                  if (isAdmin()) {
                    handleEditShift(shift);
                  }
                }}>
                              <span>
                                {employee.firstName} {employee.lastName.charAt(0)}
                              </span>
                              <span className="font-semibold">
                                {formatTime(shift.startTime)}-{formatTime(shift.endTime)}
                              </span>
                            </div>;
              })}
                    </div>
                  </div>;
        })}
            </div>}
        </>}
      
      <HoursSummary />
      
      {(isAddingShift || selectedShift) && <ShiftModal isOpen={isAddingShift || !!selectedShift} onClose={handleShiftModalClose} shift={selectedShift} date={selectedDate} dayOfWeek={currentDayOfWeek} employees={employees} onSave={handleSaveShift} onDelete={handleDeleteShift} />}
    </div>;
}
