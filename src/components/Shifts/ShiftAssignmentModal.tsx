
import { useState, useEffect } from "react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Employee, ShiftTemplate, Shift } from "@/lib/types";
import { templateService, shiftService } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ShiftAssignmentConfirmation } from "./ShiftAssignmentConfirmation";

interface ShiftAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  templates: ShiftTemplate[];
  currentMonth: Date;
  onShiftsAdded: () => void;
}

export const ShiftAssignmentModal = ({
  isOpen,
  onClose,
  employees,
  templates,
  currentMonth,
  onShiftsAdded
}: ShiftAssignmentModalProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  const [currentDate, setCurrentDate] = useState(currentMonth);
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState("weekdays");
  const [loading, setLoading] = useState(false);
  const [existingShifts, setExistingShifts] = useState<Shift[]>([]);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [shiftsToAdd, setShiftsToAdd] = useState<Array<{ date: Date, template: ShiftTemplate }>>([]);
  const [isEmployeeListOpen, setIsEmployeeListOpen] = useState(true);
  
  const isMobile = useIsMobile();
  
  const daysOfWeek = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
  
  useEffect(() => {
    if (isOpen && currentDate) {
      fetchExistingShifts();
    }
  }, [isOpen, currentDate]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchExistingShifts();
    }
  }, [selectedEmployee]);
  
  const fetchExistingShifts = async () => {
    if (!selectedEmployee) return;
    
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    
    try {
      const shifts = await shiftService.getEmployeeShifts(
        selectedEmployee.id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setExistingShifts(shifts);
    } catch (error) {
      console.error("Error fetching existing shifts:", error);
    }
  };
  
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
    setSelectedDays({});
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
    setSelectedDays({});
  };
  
  const toggleDaySelection = (dateStr: string, hasExistingShift: boolean) => {
    if (hasExistingShift) {
      toast({
        title: "Turno esistente",
        description: "Esiste già un turno assegnato per questa data.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedDays(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };
  
  const toggleDayOfWeekSelection = (day: string) => {
    setSelectedDaysOfWeek(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };
  
  const handleSave = async () => {
    if (!selectedEmployee || !selectedTemplate) {
      toast({
        title: "Selezione incompleta",
        description: "Seleziona un dipendente e un template prima di procedere.",
        variant: "destructive"
      });
      return;
    }
    
    let dates: Date[] = [];
    
    if (tab === "specific-days") {
      dates = Object.entries(selectedDays)
        .filter(([_, selected]) => selected)
        .map(([dateStr]) => new Date(dateStr));
    } else {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
      
      dates = daysInMonth.filter(date => {
        const dayName = format(date, "EEEE", { locale: it });
        const italianDayIndex = daysOfWeek.findIndex(d => d.toLowerCase() === dayName.toLowerCase());
        return selectedDaysOfWeek[daysOfWeek[italianDayIndex] || ""];
      });
    }
    
    const datesWithoutShifts = dates.filter(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      return !existingShifts.some(shift => 
        format(new Date(shift.date), "yyyy-MM-dd") === dateStr
      );
    });
    
    if (datesWithoutShifts.length === 0) {
      toast({
        title: "Nessuna data selezionata",
        description: "Seleziona almeno una data per assegnare i turni.",
        variant: "destructive"
      });
      return;
    }
    
    const shiftsToConfirm = datesWithoutShifts.map(date => ({
      date,
      template: selectedTemplate
    }));
    
    setShiftsToAdd(shiftsToConfirm);
    setIsConfirmationOpen(true);
  };
  
  const handleConfirmSave = async () => {
    if (shiftsToAdd.length === 0 || !selectedEmployee || !selectedTemplate) {
      setIsConfirmationOpen(false);
      return;
    }
    
    setLoading(true);
    const newShifts = [];
    
    try {
      for (const { date, template } of shiftsToAdd) {
        const shift = await shiftService.createShift({
          employeeId: selectedEmployee.id,
          date: format(date, "yyyy-MM-dd"),
          startTime: template.startTime,
          endTime: template.endTime,
          duration: template.duration
        });
        newShifts.push(shift);
      }
      
      if (newShifts.length > 0) {
        toast({
          title: "Turni assegnati",
          description: `${newShifts.length} turni sono stati assegnati con successo.`,
        });
        
        setIsConfirmationOpen(false);
        
        // This timeout ensures focus is handled properly before closing the dialog
        setTimeout(() => {
          setSelectedDays({});
          setSelectedDaysOfWeek({});
          setSelectedEmployee(null);
          setSelectedTemplate(null);
          
          if (onShiftsAdded) {
            onShiftsAdded();
          }
          onClose();
        }, 100);
      } else {
        throw new Error("Nessun turno è stato creato");
      }
    } catch (error) {
      console.error("Error saving shifts:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio dei turni.",
        variant: "destructive"
      });
      setIsConfirmationOpen(false);
    } finally {
      setLoading(false);
    }
  };
  
  const resetAndClose = () => {
    setSelectedDays({});
    setSelectedDaysOfWeek({});
    setSelectedEmployee(null);
    setSelectedTemplate(null);
    onShiftsAdded();
    onClose();
  };
  
  const handleCancel = () => {
    setIsConfirmationOpen(false);
    onClose();
  };
  
  const renderCalendar = () => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map((day, index) => (
          <div key={`header-${index}`} className="text-center font-medium text-xs py-1">
            {day.substring(0, 3)}
          </div>
        ))}
        
        {Array.from({ length: startDate.getDay() === 0 ? 6 : startDate.getDay() - 1 }).map((_, index) => (
          <div key={`empty-start-${index}`} className="h-10 rounded-md"></div>
        ))}
        
        {daysInMonth.map((date, index) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const hasExistingShift = existingShifts.some(shift => 
            format(new Date(shift.date), "yyyy-MM-dd") === dateStr
          );
          
          return (
            <div
              key={`day-${index}`}
              className={`
                flex flex-col items-center justify-center h-10 rounded-md cursor-pointer
                ${hasExistingShift ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                ${selectedDays[dateStr] ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                text-center
              `}
              onClick={() => toggleDaySelection(dateStr, hasExistingShift)}
            >
              <span className="text-sm">{format(date, "d")}</span>
              {hasExistingShift && (
                <Badge className="text-[9px] h-4 px-1">
                  {existingShifts.find(shift => format(new Date(shift.date), "yyyy-MM-dd") === dateStr)?.startTime.slice(0, 5)}
                </Badge>
              )}
              {selectedDays[dateStr] && <Check className="h-3 w-3 absolute" />}
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!loading && !open) {
          handleCancel();
        }
      }}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          {/* Don't use tabIndex=-1 here to avoid accessibility issues */}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Assegna Turni
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] overflow-y-auto pr-4 -mr-4">
            <div className="space-y-4">
              <Collapsible
                open={isEmployeeListOpen}
                onOpenChange={setIsEmployeeListOpen}
                className="border rounded-lg p-3"
              >
                <CollapsibleTrigger asChild>
                  <div className="flex justify-between items-center cursor-pointer">
                    <div className="font-medium">Dipendente</div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ChevronRight className={`h-4 w-4 transition-transform ${isEmployeeListOpen ? 'rotate-90' : ''}`} />
                    </Button>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                    {employees.map((employee) => (
                      <Card
                        key={employee.id}
                        className={`p-2 cursor-pointer transition-all border hover:border-primary ${
                          selectedEmployee?.id === employee.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        style={{
                          borderLeft: employee.color ? `4px solid ${employee.color}` : undefined
                        }}
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <div className="text-sm font-medium truncate">
                          {employee.firstName} {employee.lastName}
                        </div>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <div className="border rounded-lg p-3">
                <div className="font-medium mb-2">Template</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={`p-2 cursor-pointer transition-all border hover:border-primary ${
                        selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="text-sm font-medium truncate">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.startTime.slice(0, 5)} - {template.endTime.slice(0, 5)} ({template.duration}h)
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-lg p-3">
                <div className="font-medium mb-2">Date</div>
                <Tabs defaultValue="weekdays" onValueChange={value => {
                  setTab(value);
                  setSelectedDays({});
                  setSelectedDaysOfWeek({});
                }}>
                  <TabsList className="grid w-full grid-cols-2 h-9 mb-4">
                    <TabsTrigger value="weekdays" className="text-xs sm:text-sm">Giorni settimana</TabsTrigger>
                    <TabsTrigger value="specific-days" className="text-xs sm:text-sm">Giorni specifici</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="weekdays">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">
                          {format(currentDate, "MMMM yyyy", { locale: it })}
                        </div>
                        <div className="flex space-x-1">
                          <Button size="icon" variant="outline" onClick={handlePrevMonth} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={handleNextMonth} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {daysOfWeek.map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox 
                              id={day} 
                              checked={selectedDaysOfWeek[day]} 
                              onCheckedChange={() => toggleDayOfWeekSelection(day)}
                            />
                            <Label htmlFor={day}>{day}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="specific-days">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">
                          {format(currentDate, "MMMM yyyy", { locale: it })}
                        </div>
                        <div className="flex space-x-1">
                          <Button size="icon" variant="outline" onClick={handlePrevMonth} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={handleNextMonth} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {renderCalendar()}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0 pt-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={loading || !selectedEmployee || !selectedTemplate}>
              {loading ? "Salvataggio..." : "Anteprima Turni"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ShiftAssignmentConfirmation
        isOpen={isConfirmationOpen}
        onClose={() => {
          if (!loading) {
            setIsConfirmationOpen(false);
          }
        }}
        employee={selectedEmployee}
        shifts={shiftsToAdd}
        onConfirm={handleConfirmSave}
        isSubmitting={loading}
      />
    </>
  );
};
