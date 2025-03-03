
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { weekTemplateService } from "@/services/weekTemplateService";
import { WeekTemplate, WeekTemplateShift, Employee } from "@/lib/types";
import { employeeService } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  templateId: string;
}

export function ApplyTemplateModal({ isOpen, onClose, onApply, templateId }: ApplyTemplateModalProps) {
  const [targetDate, setTargetDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [template, setTemplate] = useState<WeekTemplate | null>(null);
  const [templateShifts, setTemplateShifts] = useState<WeekTemplateShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (isOpen && templateId) {
      fetchData();
    }
  }, [isOpen, templateId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch employees
      const employeeData = await employeeService.getEmployees();
      setEmployees(employeeData);
      
      // Fetch template details
      const templates = await weekTemplateService.getTemplates();
      const foundTemplate = templates.find(t => t.id === templateId);
      if (foundTemplate) {
        setTemplate(foundTemplate);
      }
      
      // Fetch template shifts
      const shifts = await weekTemplateService.getTemplateShifts(templateId);
      setTemplateShifts(shifts);
      
      // Set default target date to next Monday
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
      const daysUntilNextMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilNextMonday);
      setTargetDate(formatDate(nextMonday));
    } catch (error) {
      console.error("Error fetching template data:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il caricamento dei dati del modello.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Apply the template
      const success = await weekTemplateService.applyTemplate(templateId, targetDate);
      
      if (success) {
        onApply();
      }
    } catch (error) {
      console.error("Error applying template:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'applicazione del modello.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!targetDate) {
      toast({
        title: "Errore di validazione",
        description: "Seleziona una data di inizio.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Dipendente sconosciuto";
  };

  // Calculate the dates that will be used when applying the template
  const calculateAppliedDates = () => {
    if (!template || !targetDate) return [];
    
    const templateStartDate = new Date(template.startDate);
    const targetDateObj = new Date(targetDate);
    
    // Calculate day difference between template start date and target date
    const daysDifference = Math.floor(
      (targetDateObj.getTime() - templateStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Get unique dates from template shifts
    const uniqueDates = [...new Set(templateShifts.map(shift => shift.date))].sort();
    
    // Calculate new dates
    return uniqueDates.map(date => {
      const originalDate = new Date(date);
      const newDate = new Date(originalDate);
      newDate.setDate(originalDate.getDate() + daysDifference);
      return formatDate(newDate);
    });
  };

  const appliedDates = calculateAppliedDates();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Applica Modello Settimanale</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {template && (
              <div className="mb-4">
                <h3 className="font-medium">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                )}
                <div className="text-sm mt-2">
                  <span className="text-muted-foreground">Periodo originale:</span>{" "}
                  {new Date(template.startDate).toLocaleDateString()} - {new Date(template.endDate).toLocaleDateString()}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetDate" className="text-right">
                Data inizio
              </Label>
              <div className="col-span-3">
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Il modello verrà applicato a partire da questa data, mantenendo gli stessi giorni della settimana.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Anteprima ({templateShifts.length} turni)</h3>
              <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                {templateShifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    Nessun turno trovato nel modello.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {templateShifts.map((shift, index) => {
                      // Find corresponding new date
                      const shiftDate = new Date(shift.date);
                      const dateIndex = [...new Set(templateShifts.map(s => s.date))].sort().indexOf(shift.date);
                      const newDate = appliedDates[dateIndex] || shift.date;
                      
                      return (
                        <li key={index} className="text-sm border-b last:border-b-0 py-1">
                          <div>
                            <span className="inline-block w-32">{new Date(shift.date).toLocaleDateString()}</span>
                            <span className="text-muted-foreground mx-2">→</span>
                            <span className="font-medium">{new Date(newDate).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {getEmployeeName(shift.employeeId)} ({shift.startTime}-{shift.endTime})
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="mr-2" disabled={isSubmitting}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting ? (
              <>
                <span className="mr-2">Applicazione...</span>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </>
            ) : (
              "Applica"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
