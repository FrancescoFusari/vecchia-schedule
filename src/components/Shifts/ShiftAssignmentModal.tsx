
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format, getDay, setDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { Employee, ShiftTemplate, Shift } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { shiftService } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate("");
      setSelectedDays([]);
      setWeekdays([]);
    }
  }, [isOpen]);

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
      
      // Generate dates from weekday selection
      if (weekdays.length > 0) {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        
        daysToAssign = daysInMonth.filter(date => 
          weekdays.includes(getDay(date) === 0 ? 6 : getDay(date) - 1) // Adjust for date-fns (0 = Sunday)
        );
      }
      
      // Add individually selected days
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
      
      // Create shifts for all selected days
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
      
      // Batch create shifts
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

  if (!employee) return null;

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
              <Calendar
                mode="multiple"
                selected={selectedDays}
                onSelect={setSelectedDays as any}
                className="w-full"
                locale={it}
                month={currentMonth}
                captionLayout="dropdown-buttons"
                fromMonth={startOfMonth(currentMonth)}
                toMonth={endOfMonth(currentMonth)}
                classNames={{
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-bold",
                  day: cn(
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                  ),
                  caption: "flex justify-center pt-1 relative items-center mb-3",
                  caption_label: "text-base font-medium text-gray-800",
                  head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] uppercase",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary/5 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  month: "space-y-4 rounded-lg"
                }}
              />
            </div>
            {selectedDays.length > 0 && (
              <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                <p className="font-medium">Giorni selezionati: {selectedDays.length}</p>
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
            disabled={(!selectedDays.length && !weekdays.length) || !selectedTemplate || isSubmitting}
            className={cn(
              "transition-all duration-200",
              (selectedDays.length > 0 || weekdays.length > 0) && selectedTemplate ? "bg-primary hover:bg-primary/90" : ""
            )}
          >
            {isSubmitting ? "Assegnazione..." : `Assegna ${selectedDays.length + weekdays.length > 0 ? (selectedDays.length + weekdays.length) : ""} turni`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
