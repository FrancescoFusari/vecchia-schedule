import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format, getDay, setDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { it } from "date-fns/locale";
import { Employee, ShiftTemplate, Shift } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { shiftService } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate("");
      setSelectedDays([]);
      setWeekdays([]);
      setDisplayMonth(currentMonth);
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
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
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

  if (!employee) return null;

  const validDaysCount = filterDaysForDisplayMonth(selectedDays).length;
  const totalShiftsCount = validDaysCount + weekdays.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Assegna turni a {employee.firstName} {employee.lastName}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="weekday" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekday">Giorni della settimana</TabsTrigger>
            <TabsTrigger value="specific">Giorni specifici</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekday" className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                    onCheckedChange={() => handleWeekdayToggle(index)}
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
          </TabsContent>
          
          <TabsContent value="specific">
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm my-2">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMonthChange('previous')}
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
                  onClick={() => handleMonthChange('next')}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Calendar
                mode="multiple"
                selected={filterDaysForDisplayMonth(selectedDays)}
                onSelect={(days) => {
                  if (!days) return;
                  setSelectedDays(Array.isArray(days) ? days : []);
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
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                  ),
                  caption_label: "hidden",
                  caption: "h-1 overflow-hidden",
                  nav: "hidden",
                  head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] uppercase",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary/5 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  month: "space-y-4 rounded-lg"
                }}
              />
            </div>
            {validDaysCount > 0 && (
              <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                <p className="font-medium">Giorni selezionati: {validDaysCount}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="template">Template turno</Label>
            <Select 
              value={selectedTemplate} 
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger id="template">
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
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button 
            onClick={handleSaveAssignments} 
            disabled={(validDaysCount === 0 && weekdays.length === 0) || !selectedTemplate || isSubmitting}
            className={cn(
              "transition-all duration-200",
              totalShiftsCount > 0 && selectedTemplate ? "bg-primary hover:bg-primary/90" : ""
            )}
          >
            {isSubmitting ? "Assegnazione..." : `Assegna ${totalShiftsCount > 0 ? totalShiftsCount : ""} turni`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
