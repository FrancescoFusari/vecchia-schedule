import { useState } from "react";
import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { it } from "date-fns/locale";
import { Employee, ShiftTemplate, Shift } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { shiftService } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [activeTab, setActiveTab] = useState<string>("weekday");
  
  useState(() => {
    if (isOpen) {
      setSelectedTemplate("");
      setSelectedDays([]);
      setWeekdays([]);
      setDisplayMonth(currentMonth);
    }
  });

  const handleSaveAssignments = async () => {
    if (!employee || !selectedTemplate) {
      toast({
        title: "Errore",
        description: "Seleziona un tipo di turno",
        variant: "destructive"
      });
      return;
    }

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
        const monthStart = startOfMonth(displayMonth);
        const monthEnd = endOfMonth(displayMonth);
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

  const dayLabels = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

  const validDaysCount = selectedDays.filter(day => isSameMonth(day, displayMonth)).length;
  const weekdayShiftsCount = weekdays.length > 0 
    ? eachDayOfInterval({ 
        start: startOfMonth(displayMonth), 
        end: endOfMonth(displayMonth) 
      }).filter(date => 
        weekdays.includes(getDay(date) === 0 ? 6 : getDay(date) - 1)
      ).length 
    : 0;
  
  const totalShiftsCount = validDaysCount + weekdayShiftsCount;
  
  if (!employee) return null;

  const selectedTemplateName = templates.find(t => t.id === selectedTemplate)?.name || "Seleziona tipo di turno";

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[90vh]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle className="text-xl">
              Assegna turni: {employee.firstName} {employee.lastName}
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 space-y-6">
            <Collapsible className="w-full">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-between"
                >
                  <span>{selectedTemplateName}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      "flex items-start justify-between p-4 border rounded-lg cursor-pointer transition-colors",
                      selectedTemplate === template.id 
                        ? "bg-primary/10 border-primary" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      if (navigator.vibrate) navigator.vibrate(50);
                    }}
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {template.startTime} - {template.endTime}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        {template.duration}h
                      </Badge>
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="weekday" className="text-base">Giorni settimana</TabsTrigger>
                <TabsTrigger value="specific" className="text-base">Giorni specifici</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekday" className="mt-4">
                <div className="grid grid-cols-1 gap-3">
                  {dayLabels.map((day, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "flex items-center space-x-3 p-4 rounded-md transition-colors cursor-pointer",
                        weekdays.includes(index) ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(50);
                        setWeekdays(prev => 
                          prev.includes(index) 
                            ? prev.filter(d => d !== index) 
                            : [...prev, index]
                        );
                      }}
                    >
                      <Checkbox 
                        id={`day-${index}`}
                        checked={weekdays.includes(index)}
                        onCheckedChange={() => {
                          if (navigator.vibrate) navigator.vibrate(50);
                          setWeekdays(prev => 
                            prev.includes(index) 
                              ? prev.filter(d => d !== index) 
                              : [...prev, index]
                          );
                        }}
                        className="h-5 w-5"
                      />
                      <Label 
                        htmlFor={`day-${index}`}
                        className={cn(
                          "text-base cursor-pointer",
                          weekdays.includes(index) ? "font-medium text-primary" : ""
                        )}
                      >
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {weekdayShiftsCount > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-md flex items-center justify-between">
                    <p className="font-medium">
                      Turni selezionati:
                    </p>
                    <Badge className="text-sm px-3 py-1">
                      {weekdayShiftsCount} turni
                    </Badge>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="specific" className="mt-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(50);
                        setDisplayMonth(prevMonth => {
                          const newDate = new Date(prevMonth);
                          newDate.setMonth(newDate.getMonth() - 1);
                          return newDate;
                        });
                      }}
                      className="h-10 w-10"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-lg font-medium capitalize">
                      {format(displayMonth, 'MMMM yyyy', { locale: it })}
                    </h2>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(50);
                        setDisplayMonth(prevMonth => {
                          const newDate = new Date(prevMonth);
                          newDate.setMonth(newDate.getMonth() + 1);
                          return newDate;
                        });
                      }}
                      className="h-10 w-10"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <Calendar
                    mode="multiple"
                    selected={selectedDays}
                    onSelect={(days) => {
                      if (!days) return;
                      setSelectedDays(Array.isArray(days) ? days : []);
                      if (navigator.vibrate) navigator.vibrate(50);
                    }}
                    className="w-full"
                    locale={it}
                    month={displayMonth}
                    onMonthChange={setDisplayMonth}
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day: cn(
                        "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                      ),
                      head_cell: "text-muted-foreground rounded-md w-10 font-medium text-[0.8rem] uppercase",
                      cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary/5 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      month: "space-y-4"
                    }}
                  />
                  
                  {validDaysCount > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-md flex items-center justify-between">
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
          </div>
          
          <DrawerFooter className="px-4 pb-8">
            <div className="flex flex-col gap-3">
              <Button 
                size="lg"
                className="h-12"
                onClick={handleSaveAssignments}
                disabled={!selectedTemplate || totalShiftsCount === 0 || isSubmitting}
              >
                {isSubmitting ? "Assegnazione..." : `Assegna ${totalShiftsCount} turni`}
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={onClose}
                className="h-12"
              >
                Annulla
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
