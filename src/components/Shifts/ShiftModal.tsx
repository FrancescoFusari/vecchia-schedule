import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { templateService } from "@/lib/supabase";
import { Employee, Shift, ShiftTemplate } from "@/lib/types";
import { DEFAULT_SHIFT_TEMPLATES } from "@/lib/constants";
import { calculateShiftDuration, formatDate, generateId } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  date: Date | null;
  dayOfWeek?: number;
  employees: Employee[];
  onSave: (shift: Shift) => void;
  onDelete: (shiftId: string) => void;
}

export function ShiftModal({ 
  isOpen, 
  onClose, 
  shift, 
  date, 
  dayOfWeek,
  employees, 
  onSave, 
  onDelete 
}: ShiftModalProps) {
  const [employeeId, setEmployeeId] = useState(shift?.employeeId || "");
  const [shiftDate, setShiftDate] = useState("");
  const [startTime, setStartTime] = useState(shift?.startTime || "");
  const [endTime, setEndTime] = useState(shift?.endTime || "");
  const [notes, setNotes] = useState(shift?.notes || "");
  const [duration, setDuration] = useState(shift?.duration || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(shift?.status === 'draft');
  
  const [templates, setTemplates] = useState<ShiftTemplate[]>(DEFAULT_SHIFT_TEMPLATES);
  const [allTemplates, setAllTemplates] = useState<ShiftTemplate[]>([]);
  
  useEffect(() => {
    if (shift) {
      setShiftDate(shift.date);
      console.log(`Setting date from shift: ${shift.date}`);
    } else if (date) {
      const formattedDate = formatDate(date);
      console.log(`Setting date from prop: ${formattedDate}`);
      setShiftDate(formattedDate);
    }
  }, [shift, date]);
  
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesData = await templateService.getTemplates();
        console.log("Templates fetched for shift modal:", templatesData);
        setAllTemplates(templatesData);
        
        if (dayOfWeek !== undefined) {
          filterTemplatesByDay(templatesData, dayOfWeek);
        } else {
          setTemplates(templatesData);
        }
      } catch (error) {
        console.error("Error fetching shift templates:", error);
        toast({
          title: "Attenzione",
          description: "Impossibile caricare i template, verranno utilizzati i template predefiniti.",
          variant: "destructive",
        });
        setTemplates(DEFAULT_SHIFT_TEMPLATES);
      }
    };
    
    fetchTemplates();
  }, [isOpen, dayOfWeek]);
  
  const filterTemplatesByDay = (allTemplates: ShiftTemplate[], day: number) => {
    console.log(`Filtering templates for day: ${day}`);
    
    const filtered = allTemplates.filter(template => {
      if (!template.daysOfWeek || template.daysOfWeek.length === 0) {
        return true;
      }
      
      return template.daysOfWeek.includes(day);
    });
    
    console.log(`Filtered templates: ${filtered.length}`);
    setTemplates(filtered);
  };
  
  useEffect(() => {
    if (startTime && endTime) {
      const calculatedDuration = calculateShiftDuration(startTime, endTime);
      setDuration(calculatedDuration);
    }
  }, [startTime, endTime]);
  
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setStartTime(template.startTime);
      setEndTime(template.endTime);
    }
  };
  
  const validateForm = () => {
    if (!employeeId) {
      toast({
        title: "Errore di validazione",
        description: "Seleziona un dipendente.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!shiftDate) {
      toast({
        title: "Errore di validazione",
        description: "Seleziona una data per il turno.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!startTime) {
      toast({
        title: "Errore di validazione",
        description: "Inserisci l'orario di inizio.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!endTime) {
      toast({
        title: "Errore di validazione",
        description: "Inserisci l'orario di fine.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (saveAsDraft = false) => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      console.log(`Saving shift with date: ${shiftDate}, as draft: ${saveAsDraft}`);
      
      const updatedShift: Shift = {
        id: shift?.id || generateId(),
        employeeId,
        date: shiftDate,
        startTime,
        endTime,
        duration,
        notes,
        status: saveAsDraft ? 'draft' : 'published',
        createdAt: shift?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await onSave(updatedShift);
      onClose();
      
      toast({
        title: saveAsDraft ? "Turno salvato come bozza" : "Turno pubblicato",
        description: `Il turno è stato ${saveAsDraft ? 'salvato come bozza' : 'pubblicato'} con successo.`,
      });
    } catch (error) {
      console.error("Error saving shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del turno.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (shift) {
      try {
        setIsSubmitting(true);
        await onDelete(shift.id);
        onClose();
      } catch (error) {
        console.error("Error deleting shift:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante l'eliminazione del turno.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    }
  };
  
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    
    return templates.filter(template => {
      if (!template.daysOfWeek || template.daysOfWeek.length === 0) {
        return true;
      }
      
      if (date) {
        const dateObj = new Date(date);
        let dayOfWeek = dateObj.getDay();
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        return template.daysOfWeek.includes(dayOfWeek);
      }
      
      return true;
    });
  }, [templates, date]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {shift ? "Modifica turno" : "Aggiungi turno"}
          </DialogTitle>
          <DialogDescription>
            {shift ? "Modifica i dettagli del turno esistente." : "Aggiungi un nuovo turno."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee" className="text-right">
              Dipendente
            </Label>
            <Select
              value={employeeId}
              onValueChange={setEmployeeId}
              disabled={isSubmitting}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleziona dipendente" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data
            </Label>
            <Input
              id="date"
              type="date"
              value={shiftDate}
              onChange={(e) => {
                console.log(`Date changed to: ${e.target.value}`);
                setShiftDate(e.target.value);
              }}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="template" className="text-right">
              Template
            </Label>
            <Select
              onValueChange={applyTemplate}
              disabled={isSubmitting}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleziona template" />
              </SelectTrigger>
              <SelectContent>
                {filteredTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.startTime}-{template.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              Inizio
            </Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="text-right">
              Fine
            </Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Durata
            </Label>
            <div className="col-span-3 flex items-center">
              <Input
                id="duration"
                type="number"
                value={duration}
                readOnly
                className="bg-gray-50"
              />
              <span className="ml-2">ore</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Note
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="Note opzionali"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          {shift && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isSubmitting}>Elimina</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione eliminerà definitivamente il turno e non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
                    Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="mr-2" disabled={isSubmitting}>
              Annulla
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleSubmit(true)} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salva come bozza"}
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2">Pubblicando...</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                "Pubblica"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
