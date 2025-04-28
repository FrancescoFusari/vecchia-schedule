
import { useState, useEffect } from "react";
import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isEqual } from "date-fns";
import { it } from "date-fns/locale";
import { Employee, ShiftTemplate, Shift } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { shiftService } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight,
  Check,
  X
} from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface MobileShiftAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  templates: ShiftTemplate[];
  currentMonth: Date;
  onShiftsAdded: () => void;
}

export function MobileShiftAssignmentModal({
  isOpen,
  onClose,
  employee,
  templates,
  currentMonth,
  onShiftsAdded,
}: MobileShiftAssignmentModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayMonth, setDisplayMonth] = useState<Date>(currentMonth);
  const [selectedMonth, setSelectedMonth] = useState<Date>(currentMonth);
  const [activeTab, setActiveTab] = useState<string>("template");
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate("");
      setSelectedDays([]);
      setWeekdays([]);
      setDisplayMonth(currentMonth);
      setSelectedMonth(currentMonth);
      setActiveTab("template");
    }
  }, [isOpen, currentMonth]);

  // Handle shift assignment
  const handleSaveAssignments = async () => {
    if (!employee) return;
    
    try {
      setIsSubmitting(true);
      
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) {
        toast({ 
          title: "Errore", 
          description: "Seleziona un template valido", 
          variant: "destructive" 
        });
        return;
      }
      
      let daysToAssign: Date[] = [];
      
      if (weekdays.length > 0) {
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        
        daysToAssign = daysInMonth.filter(date => 
          weekdays.includes(getDay(date) === 0 ? 6 : getDay(date) - 1)
        );
      }
      
      selectedDays.forEach(day => {
        if (!daysToAssign.some(d => isSameDay(d, day))) {
          daysToAssign.push(day);
        }
      });
      
      if (daysToAssign.length === 0) {
        toast({ 
          title: "Attenzione", 
          description: "Nessun giorno selezionato", 
          variant: "destructive" 
        });
        return;
      }
      
      const newShifts: Shift[] = daysToAssign.map(day => ({
        id: uuidv4(),
        employeeId: employee.id,
        date: format(day, 'yyyy-MM-dd'),
        startTime: template.startTime,
        endTime: template.endTime,
        duration: template.duration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      await shiftService.createShifts(newShifts);
      
      // Add haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      toast({
        title: "Turni assegnati",
        description: `${newShifts.length} turni assegnati a ${employee.firstName} ${employee.lastName}`,
      });
      
      onShiftsAdded();
      onClose();
    } catch (error) {
      console.error("Error assigning shifts:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'assegnazione dei turni",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWeekdayToggle = (day: number) => {
    // Add haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setWeekdays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };
  
  const handleNextTab = () => {
    if (activeTab === "template" && selectedTemplate) {
      setActiveTab("days");
    } else if (activeTab === "days") {
      handleSaveAssignments();
    }
  };
  
  const handlePrevTab = () => {
    if (activeTab === "days") {
      setActiveTab("template");
    }
  };
  
  const dayLabels = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

  const filterDaysForDisplayMonth = (days: Date[]) => {
    return days.filter(day => isSameMonth(day, displayMonth));
  };

  const handleMonthChange = (direction: 'previous' | 'next') => {
    const newDate = new Date(displayMonth);
    if (direction === 'previous') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setDisplayMonth(newDate);
  };
  
  const handleSelectedMonthChange = (direction: 'previous' | 'next') => {
    const newDate = direction === 'previous' 
      ? subMonths(selectedMonth, 1) 
      : addMonths(selectedMonth, 1);
    setSelectedMonth(newDate);
    
    // Add haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };
  
  if (!employee) return null;

  const validDaysCount = filterDaysForDisplayMonth(selectedDays).length;
  const weekdayShiftsCount = weekdays.length > 0 
    ? eachDayOfInterval({ 
        start: startOfMonth(selectedMonth), 
        end: endOfMonth(selectedMonth) 
      }).filter(date => 
        weekdays.includes(getDay(date) === 0 ? 6 : getDay(date) - 1)
      ).length 
    : 0;
  
  const totalShiftsCount = validDaysCount + weekdayShiftsCount;
  const canProceed = activeTab === "template" ? !!selectedTemplate : totalShiftsCount > 0;
  
  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[90vh]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle className="text-xl">
              Assegna turni: {employee.firstName} {employee.lastName}
            </DrawerTitle>
            <DrawerDescription>
              {activeTab === "template" 
                ? "Seleziona un tipo di turno da assegnare" 
                : "Seleziona giorni o giorni della settimana"}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4">
            {activeTab === "template" ? (
              <div className="space-y-6 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="template-mobile" className="text-base">
                    Seleziona tipo di turno
                  </Label>
                  <div className="grid gap-3">
                    {templates.map(template => (
                      <div
                        key={template.id}
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                          selectedTemplate === template.id 
                            ? "bg-primary/10 border-primary" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          if (navigator.vibrate) navigator.vibrate(50);
                        }}
                      >
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {template.startTime} - {template.endTime} ({template.duration}h)
                          </p>
                        </div>
                        {selectedTemplate === template.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="weekday" className="pb-4">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="weekday" className="text-base">Giorni settimana</TabsTrigger>
                  <TabsTrigger value="specific" className="text-base">Giorni specifici</TabsTrigger>
                </TabsList>
                
                <TabsContent value="weekday" className="space-y-4 mt-4">
                  <div className="bg-card p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSelectedMonthChange('previous')}
                        className="h-10 w-10"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <h2 className="text-center text-lg font-medium capitalize">
                        {format(selectedMonth, 'MMMM yyyy', { locale: it })}
                      </h2>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSelectedMonthChange('next')}
                        className="h-10 w-10"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {dayLabels.map((day, index) => (
                        <div 
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-md transition-colors",
                            weekdays.includes(index) ? "bg-primary/10" : "hover:bg-muted/50"
                          )} 
                          key={index}
                          onClick={() => handleWeekdayToggle(index)}
                        >
                          <Checkbox 
                            id={`day-${index}`} 
                            checked={weekdays.includes(index)}
                            onCheckedChange={() => handleWeekdayToggle(index)}
                            className="h-5 w-5"
                          />
                          <Label 
                            htmlFor={`day-${index}`}
                            className={cn(
                              "text-base",
                              weekdays.includes(index) ? "font-medium text-primary" : ""
                            )}
                          >
                            {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {weekdayShiftsCount > 0 && (
                      <div className="mt-4 p-3 bg-muted rounded-md flex items-center justify-between">
                        <p className="font-medium">
                          Turni selezionati:
                        </p>
                        <Badge className="text-sm px-3 py-1">
                          {weekdayShiftsCount} turni
                        </Badge>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="specific">
                  <div className="bg-card p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMonthChange('previous')}
                        className="h-10 w-10"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <h2 className="text-center text-lg font-medium capitalize">
                        {format(displayMonth, 'MMMM yyyy', { locale: it })}
                      </h2>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMonthChange('next')}
                        className="h-10 w-10"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <Calendar
                      mode="multiple"
                      selected={filterDaysForDisplayMonth(selectedDays)}
                      onSelect={(days) => {
                        if (!days) return;
                        setSelectedDays(Array.isArray(days) ? days : []);
                        // Add haptic feedback if supported
                        if (navigator.vibrate) {
                          navigator.vibrate(50);
                        }
                      }}
                      className="w-full"
                      locale={it}
                      month={displayMonth}
                      onMonthChange={setDisplayMonth}
                      disabled={undefined}
                      classNames={{
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground font-bold",
                        day: cn(
                          "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                        ),
                        caption_label: "hidden",
                        caption: "h-1 overflow-hidden",
                        nav: "hidden",
                        head_cell: "text-muted-foreground rounded-md w-10 font-medium text-[0.8rem] uppercase",
                        cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary/5 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        month: "space-y-4 rounded-lg"
                      }}
                    />
                    {validDaysCount > 0 && (
                      <div className="mt-4 p-3 bg-muted rounded-md flex items-center justify-between">
                        <p className="font-medium">
                          Giorni selezionati:
                        </p>
                        <Badge className="text-sm px-3 py-1">
                          {validDaysCount} giorni
                        </Badge>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
          
          <DrawerFooter className="px-4 pb-8">
            <div className="flex flex-col gap-3">
              {activeTab === "days" && (
                <div className="bg-muted p-3 rounded-lg mb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Tipo turno:</h3>
                      <p className="text-sm text-muted-foreground">
                        {templates.find(t => t.id === selectedTemplate)?.name} 
                        ({templates.find(t => t.id === selectedTemplate)?.startTime}-
                        {templates.find(t => t.id === selectedTemplate)?.endTime})
                      </p>
                    </div>
                    <Badge className="text-sm px-3 py-1">
                      {totalShiftsCount} turni
                    </Badge>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="flex-1 h-12"
                  onClick={activeTab === "template" ? onClose : handlePrevTab}
                >
                  {activeTab === "template" ? (
                    <>
                      <X className="h-5 w-5 mr-2" />
                      Annulla
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="h-5 w-5 mr-2" />
                      Indietro
                    </>
                  )}
                </Button>
                
                <Button 
                  size="lg"
                  className="flex-1 h-12"
                  onClick={handleNextTab}
                  disabled={!canProceed || isSubmitting}
                >
                  {activeTab === "template" ? (
                    <>
                      Avanti
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </>
                  ) : isSubmitting ? (
                    "Assegnazione..."
                  ) : (
                    `Assegna ${totalShiftsCount} turni`
                  )}
                </Button>
              </div>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
