import { useState, useEffect } from "react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isEqual } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Employee, ShiftTemplate, Shift } from "@/lib/types";
import { templateService, shiftService } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShiftAssignmentConfirmation } from "./ShiftAssignmentConfirmation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MobileShiftAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  templates: ShiftTemplate[];
  currentMonth: Date;
  onShiftsAdded: () => void;
}

export const MobileShiftAssignmentModal = ({
  isOpen,
  onClose,
  employees,
  templates,
  currentMonth,
  onShiftsAdded
}: MobileShiftAssignmentModalProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  const [currentDate, setCurrentDate] = useState(currentMonth);
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState("weekdays");
  const [loading, setLoading] = useState(false);
  const [existingShifts, setExistingShifts] = useState<Shift[]>([]);
  const [step, setStep] = useState<"employee" | "template" | "days">("employee");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [shiftsToAdd, setShiftsToAdd] = useState<Array<{ date: Date, template: ShiftTemplate }>>([]);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  
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
  
  const handlePrevStep = () => {
    if (step === "template") setStep("employee");
    else if (step === "days") setStep("template");
  };
  
  const handleNextStep = () => {
    if (step === "employee") {
      if (!selectedEmployee) {
        toast({
          title: "Dipendente non selezionato",
          description: "Seleziona un dipendente prima di procedere.",
          variant: "destructive"
        });
        return;
      }
      setStep("template");
    } else if (step === "template") {
      if (!selectedTemplate) {
        toast({
          title: "Template non selezionato",
          description: "Seleziona un template prima di procedere.",
          variant: "destructive"
        });
        return;
      }
      setStep("days");
    }
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
    
    // Filter out dates with existing shifts
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
    
    // Prepare shifts for confirmation
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
      
      toast({
        title: "Turni assegnati",
        description: `${newShifts.length} turni sono stati assegnati con successo.`,
      });
      
      // Critical: Make sure to update the calendar view
      onShiftsAdded(); // This will trigger the main calendar refresh
      
      setSelectedDays({});
      setSelectedDaysOfWeek({});
      setIsConfirmationOpen(false);
      onClose();
    } catch (error) {
      console.error("Error saving shifts:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio dei turni.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
          <div key={`empty-start-${index}`} className="h-8 w-8 rounded-md"></div>
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
                flex flex-col items-center justify-center h-8 w-8 rounded-md cursor-pointer
                ${hasExistingShift ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                ${selectedDays[dateStr] ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
              `}
              onClick={() => toggleDaySelection(dateStr, hasExistingShift)}
            >
              <span className="text-xs">{format(date, "d")}</span>
              {hasExistingShift && (
                <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                  <div className="h-1 w-1 bg-emerald-500 dark:bg-emerald-400 rounded-full"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <>
      <Drawer open={isOpen} onOpenChange={open => !loading && !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {step === "employee" && "Seleziona Dipendente"}
              {step === "template" && "Seleziona Template"}
              {step === "days" && "Seleziona Giorni"}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4">
            {step === "employee" && (
              <div className="grid grid-cols-2 gap-2 pb-20">
                {employees.map((employee) => (
                  <Card
                    key={employee.id}
                    className={`p-3 cursor-pointer transition-all border ${
                      selectedEmployee?.id === employee.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    style={{
                      borderLeft: employee.color ? `4px solid ${employee.color}` : undefined
                    }}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </div>
                    {employee.position && (
                      <div className="text-xs text-muted-foreground">
                        {employee.position}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
            
            {step === "template" && (
              <div className="pb-20">
                <div className="flex items-center mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1" 
                    onClick={handlePrevStep}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Indietro</span>
                  </Button>
                  <div className="flex-grow text-center">
                    <DrawerTitle>
                      {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                    </DrawerTitle>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={`p-3 cursor-pointer transition-all border ${
                        selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>{template.startTime.slice(0, 5)} - {template.endTime.slice(0, 5)}</span>
                        <Badge variant="outline">{template.duration}h</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {step === "days" && (
              <div className="pb-20">
                <div className="flex items-center mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1" 
                    onClick={handlePrevStep}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Indietro</span>
                  </Button>
                  <div className="flex-grow text-center">
                    <div className="text-sm">
                      <span className="font-medium">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</span> -
                      <span className="text-muted-foreground"> {selectedTemplate?.name}</span>
                    </div>
                  </div>
                </div>
                
                <Tabs defaultValue="weekdays" onValueChange={value => {
                  setTab(value);
                  setSelectedDays({});
                  setSelectedDaysOfWeek({});
                }}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="weekdays">Giorni settimana</TabsTrigger>
                    <TabsTrigger value="specific-days">Giorni specifici</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="weekdays" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">
                        {format(currentDate, "MMMM yyyy", { locale: it })}
                      </div>
                      <div className="flex space-x-1">
                        <Button size="icon" variant="outline" onClick={handlePrevMonth} className="h-8 w-8 p-0">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={handleNextMonth} className="h-8 w-8 p-0">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {daysOfWeek.map((day) => (
                        <div key={day} className="flex items-center space-x-2 p-2">
                          <Checkbox 
                            id={`mobile-${day}`} 
                            checked={selectedDaysOfWeek[day]} 
                            onCheckedChange={() => toggleDayOfWeekSelection(day)}
                          />
                          <Label htmlFor={`mobile-${day}`} className="flex-grow">{day}</Label>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="specific-days" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">
                        {format(currentDate, "MMMM yyyy", { locale: it })}
                      </div>
                      <div className="flex space-x-1">
                        <Button size="icon" variant="outline" onClick={handlePrevMonth} className="h-8 w-8 p-0">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={handleNextMonth} className="h-8 w-8 p-0">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      {renderCalendar()}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
          
          <DrawerFooter>
            {step !== "days" ? (
              <Button 
                onClick={handleNextStep} 
                disabled={loading || (step === "employee" && !selectedEmployee) || (step === "template" && !selectedTemplate)}
                className="w-full"
              >
                Continua
              </Button>
            ) : (
              <Button 
                onClick={handleSave} 
                disabled={loading || !selectedEmployee || !selectedTemplate || 
                  (tab === "weekdays" && Object.values(selectedDaysOfWeek).filter(Boolean).length === 0) || 
                  (tab === "specific-days" && Object.values(selectedDays).filter(Boolean).length === 0)}
                className="w-full"
              >
                {loading ? "Salvataggio..." : "Anteprima Turni"}
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      <ShiftAssignmentConfirmation
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        employee={selectedEmployee}
        shifts={shiftsToAdd}
        onConfirm={handleConfirmSave}
        isSubmitting={loading}
      />
    </>
  );
};
