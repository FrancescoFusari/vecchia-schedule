import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { it } from "date-fns/locale";
import { Employee, ShiftTemplate, Shift } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { shiftService } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, ChevronDown, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShiftAssignmentConfirmation } from "./ShiftAssignmentConfirmation";

interface ShiftAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  templates: ShiftTemplate[];
  currentMonth: Date;
  onShiftsAdded: () => void;
}

export const ShiftAssignmentModal: React.FC<ShiftAssignmentModalProps> = ({
  isOpen,
  onClose,
  employees,
  templates,
  currentMonth,
  onShiftsAdded,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayMonth, setDisplayMonth] = useState<Date>(currentMonth);
  const [activeTab, setActiveTab] = useState<string>("weekday");
  const [weekdayMonth, setWeekdayMonth] = useState<Date>(displayMonth);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSaveAssignments = async () => {
    if (!selectedEmployee || !selectedTemplate) {
      toast({
        title: "Errore",
        description: "Seleziona un dipendente e un tipo di turno",
        variant: "destructive"
      });
      return;
    }
    
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
      const monthStart = startOfMonth(weekdayMonth);
      const monthEnd = endOfMonth(weekdayMonth);
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

    setShowConfirmation(true);
  };

  const handleConfirmAssignment = async () => {
    try {
      setIsSubmitting(true);
      
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template || !selectedEmployee) return;
      
      let daysToAssign: Date[] = [];
      
      if (weekdays.length > 0) {
        const monthStart = startOfMonth(weekdayMonth);
        const monthEnd = endOfMonth(weekdayMonth);
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
      
      const newShifts: Shift[] = daysToAssign.map(day => ({
        id: uuidv4(),
        employeeId: selectedEmployee.id,
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
        description: `${newShifts.length} turni assegnati a ${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
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
      setShowConfirmation(false);
    }
  };

  const dayLabels = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

  const validDaysCount = selectedDays.filter(day => isSameMonth(day, displayMonth)).length;
  const weekdayShiftsCount = weekdays.length > 0 
    ? eachDayOfInterval({ 
        start: startOfMonth(weekdayMonth), 
        end: endOfMonth(weekdayMonth) 
      }).filter(date => 
        weekdays.includes(getDay(date) === 0 ? 6 : getDay(date) - 1)
      ).length 
    : 0;
  
  const totalShiftsCount = validDaysCount + weekdayShiftsCount;

  const selectedTemplateName = templates.find(t => t.id === selectedTemplate)?.name || "Seleziona tipo di turno";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[800px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {selectedEmployee ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8" style={{ backgroundColor: selectedEmployee.color }}>
                    <span className="text-sm font-medium text-white">
                      {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                    </span>
                  </Avatar>
                  <div>
                    <span className="text-lg">Assegna turni a </span>
                    <span className="font-semibold">{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
                  </div>
                </div>
              ) : (
                "Assegnazione Turni"
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[80vh]">
            <div className="p-6 space-y-6">
              {/* Employee Selection */}
              <Collapsible 
                className="w-full border rounded-lg" 
                open={!selectedEmployee}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between p-4 h-auto"
                  >
                    <div className="flex items-center gap-3">
                      {selectedEmployee ? (
                        <>
                          <Avatar 
                            className="h-8 w-8" 
                            style={{ backgroundColor: selectedEmployee.color }}
                          >
                            <span className="text-sm font-medium text-white">
                              {selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}
                            </span>
                          </Avatar>
                          <span className="font-medium">
                            {selectedEmployee.firstName} {selectedEmployee.lastName}
                          </span>
                        </>
                      ) : (
                        <>
                          <User className="h-5 w-5 text-muted-foreground" />
                          <span className="text-muted-foreground">Seleziona dipendente</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent/50",
                        selectedEmployee?.id === employee.id && "bg-primary/10 border-primary"
                      )}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <Avatar 
                        className="h-8 w-8" 
                        style={{ backgroundColor: employee.color }}
                      >
                        <span className="text-sm font-medium text-white">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {employee.firstName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {employee.lastName}
                        </p>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Shift Template Selection */}
              {selectedEmployee && (
                <>
                  <Collapsible className="w-full">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-between"
                      >
                        <span>{selectedTemplate ? templates.find(t => t.id === selectedTemplate)?.name : "Seleziona tipo di turno"}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {templates.map((template) => (
                          <div
                            key={template.id}
                            className={cn(
                              "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                              selectedTemplate === template.id 
                                ? "bg-primary/10 border-primary" 
                                : "hover:bg-muted/50"
                            )}
                            onClick={() => setSelectedTemplate(template.id)}
                          >
                            <div className="space-y-1">
                              <p className="font-medium">{template.name}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {template.startTime} - {template.endTime}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {template.duration}h
                                </Badge>
                              </div>
                            </div>
                            {selectedTemplate === template.id && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-11">
                      <TabsTrigger value="weekday" className="text-base">Giorni settimana</TabsTrigger>
                      <TabsTrigger value="specific" className="text-base">Giorni specifici</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="weekday" className="mt-4">
                      <div className="mb-4 flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setWeekdayMonth(prevMonth => {
                            const newDate = new Date(prevMonth);
                            newDate.setMonth(newDate.getMonth() - 1);
                            return newDate;
                          })}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-lg font-medium capitalize">
                          {format(weekdayMonth, 'MMMM yyyy', { locale: it })}
                        </h2>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setWeekdayMonth(prevMonth => {
                            const newDate = new Date(prevMonth);
                            newDate.setMonth(newDate.getMonth() + 1);
                            return newDate;
                          })}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {dayLabels.map((day, index) => (
                          <div 
                            key={index}
                            className={cn(
                              "flex items-center space-x-2 p-3 rounded-md transition-colors cursor-pointer",
                              weekdays.includes(index) ? "bg-primary/10" : "hover:bg-muted/50"
                            )}
                            onClick={() => {
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
                        <div className="mt-4 p-3 bg-muted rounded-md flex items-center justify-between">
                          <p className="font-medium">Turni selezionati:</p>
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
                            onClick={() => setDisplayMonth(prevMonth => {
                              const newDate = new Date(prevMonth);
                              newDate.setMonth(newDate.getMonth() - 1);
                              return newDate;
                            })}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <h2 className="text-lg font-medium capitalize">
                            {format(displayMonth, 'MMMM yyyy', { locale: it })}
                          </h2>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDisplayMonth(prevMonth => {
                              const newDate = new Date(prevMonth);
                              newDate.setMonth(newDate.getMonth() + 1);
                              return newDate;
                            })}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Calendar
                          mode="multiple"
                          selected={selectedDays}
                          onSelect={setSelectedDays}
                          className="w-full"
                          locale={it}
                          month={displayMonth}
                          onMonthChange={setDisplayMonth}
                          classNames={{
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day: cn(
                              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                            ),
                          }}
                        />
                        
                        {validDaysCount > 0 && (
                          <div className="mt-4 p-3 bg-muted rounded-md flex items-center justify-between">
                            <p className="font-medium">Giorni selezionati:</p>
                            <Badge className="text-sm px-3 py-1">
                              {validDaysCount} giorni
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 border-t">
            <Button 
              className="w-full"
              size="lg"
              onClick={handleSaveAssignments}
              disabled={!selectedEmployee || !selectedTemplate || (selectedDays.length === 0 && weekdays.length === 0) || isSubmitting}
            >
              {isSubmitting ? "Assegnazione..." : "Assegna turni"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showConfirmation && selectedEmployee && selectedTemplate && (
        <ShiftAssignmentConfirmation
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmAssignment}
          employee={selectedEmployee}
          template={templates.find(t => t.id === selectedTemplate)!}
          selectedDays={selectedDays}
          weekdays={weekdays}
          weekdayMonth={weekdayMonth}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
};
