
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
                <div className="flex items-center space-x-2" key={index}>
                  <Checkbox 
                    id={`day-${index}`} 
                    checked={weekdays.includes(index)}
                    onCheckedChange={() => handleWeekdayToggle(index)}
                  />
                  <Label htmlFor={`day-${index}`}>{day}</Label>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="specific">
            <Calendar
              mode="multiple"
              selected={selectedDays}
              onSelect={setSelectedDays as any}
              className="rounded-md border my-2"
              locale={it}
              month={currentMonth}
              captionLayout="dropdown-buttons"
              fromMonth={startOfMonth(currentMonth)}
              toMonth={endOfMonth(currentMonth)}
            />
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
          >
            {isSubmitting ? "Assegnazione..." : "Assegna turni"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
