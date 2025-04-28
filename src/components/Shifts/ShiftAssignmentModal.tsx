import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { Employee, ShiftTemplate, Shift } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { shiftService } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ShiftAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  templates: ShiftTemplate[];
  currentMonth: Date;
  onShiftsAdded: () => void;
}

export const ShiftAssignmentModal: React.FC<ShiftAssignmentModalProps> = ({
  isOpen,
  onClose,
  employee,
  templates,
  currentMonth,
  onShiftsAdded,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayMonth, setDisplayMonth] = useState<Date>(currentMonth);
  const [selectedMonth, setSelectedMonth] = useState<Date>(currentMonth);
  
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate("");
      setSelectedDays([]);
      setWeekdays([]);
      setDisplayMonth(currentMonth);
      setSelectedMonth(currentMonth);
    }
  }, [isOpen, currentMonth]);

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
    setWeekdays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };
  
  const dayLabels = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

  const validDaysCount = selectedDays.filter(day => isSameMonth(day, displayMonth)).length;
  const weekdayShiftsCount = weekdays.length > 0 
    ? eachDayOfInterval({ 
        start: startOfMonth(selectedMonth), 
        end: endOfMonth(selectedMonth) 
      }).filter(date => 
        weekdays.includes(getDay(date) === 0 ? 6 : getDay(date) - 1)
      ).length 
    : 0;
  
  const totalShiftsCount = validDaysCount + weekdayShiftsCount;

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Assegna turni a {employee.firstName} {employee.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">1. Seleziona tipo di turno</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedTemplate} 
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.startTime}-{template.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedTemplate && (
            <>
              <Separator />
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">2. Seleziona i giorni</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Giorni della settimana</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {dayLabels.map((day, index) => (
                        <div 
                          className={cn(
                            "flex items-center space-x-2 p-2 rounded-md transition-colors",
                            weekdays.includes(index) ? "bg-primary/10" : ""
                          )} 
                          key={index}
                        >
                          <Checkbox 
                            id={`day-${index}`} 
                            checked={weekdays.includes(index)}
                            onCheckedChange={() => {
                              setWeekdays(prev => 
                                prev.includes(index) 
                                  ? prev.filter(d => d !== index) 
                                  : [...prev, index]
                              );
                            }}
                          />
                          <Label 
                            htmlFor={`day-${index}`}
                            className={cn(
                              weekdays.includes(index) ? "font-medium text-primary" : ""
                            )}
                          >
                            {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Giorni specifici</h3>
                    <div className="bg-card rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newDate = subMonths(displayMonth, 1);
                            setDisplayMonth(newDate);
                          }}
                          className="h-8 w-8"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-center font-medium capitalize">
                          {format(displayMonth, 'MMMM yyyy', { locale: it })}
                        </h2>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newDate = addMonths(displayMonth, 1);
                            setDisplayMonth(newDate);
                          }}
                          className="h-8 w-8"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Calendar
                        mode="multiple"
                        selected={selectedDays}
                        onSelect={(days) => {
                          if (!days) return;
                          setSelectedDays(Array.isArray(days) ? days : []);
                        }}
                        className="w-full"
                        locale={it}
                        month={displayMonth}
                        onMonthChange={setDisplayMonth}
                        classNames={{
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-bold",
                          day: cn(
                            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                          ),
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        
        <DialogFooter>
          <div className="w-full flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            {(weekdayShiftsCount > 0 || validDaysCount > 0) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Totale turni:</span>
                <Badge variant="secondary" className="h-6">
                  {totalShiftsCount}
                </Badge>
              </div>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button 
                onClick={handleSaveAssignments} 
                disabled={(validDaysCount === 0 && weekdayShiftsCount === 0) || !selectedTemplate || isSubmitting}
              >
                {isSubmitting ? "Assegnazione..." : "Assegna turni"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
