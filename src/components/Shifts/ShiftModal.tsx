
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Employee, Shift } from "@/lib/types";
import { shiftService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift?: Shift | null;
  employees: Employee[];
  selectedDate?: Date | null;
}

export default function ShiftModal({ 
  isOpen, 
  onClose, 
  shift, 
  employees, 
  selectedDate 
}: ShiftModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Form state
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("18:00");
  const [notes, setNotes] = useState("");

  // Set default values when opening the modal
  useEffect(() => {
    if (shift) {
      setEmployeeId(shift.employeeId);
      setDate(shift.date);
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
      setNotes(shift.notes || "");
    } else if (selectedDate) {
      setDate(format(selectedDate, "yyyy-MM-dd"));
      setEmployeeId(employees.length > 0 ? employees[0].id : "");
    }
  }, [shift, selectedDate, employees]);

  // Calculate the duration between start and end time
  const calculateDuration = (start: string, end: string): number => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    
    let duration = (endHours - startHours) + (endMinutes - startMinutes) / 60;
    
    // If end time is before start time, assume it's the next day
    if (duration < 0) {
      duration += 24;
    }
    
    return parseFloat(duration.toFixed(2));
  };

  const handleSubmit = async () => {
    if (!employeeId || !date || !startTime || !endTime) {
      toast({
        title: "Errore",
        description: "Tutti i campi sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const duration = calculateDuration(startTime, endTime);
      
      if (shift) {
        // Update existing shift
        await shiftService.update({
          ...shift,
          employeeId,
          date,
          startTime,
          endTime,
          duration,
          notes
        });
        
        toast({
          title: "Turno aggiornato",
          description: "Il turno è stato aggiornato con successo",
        });
      } else {
        // Create new shift
        await shiftService.create({
          employeeId,
          date,
          startTime,
          endTime,
          duration,
          notes
        });
        
        toast({
          title: "Turno creato",
          description: "Il nuovo turno è stato creato con successo",
        });
      }
      
      // Refresh shifts data
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      onClose();
    } catch (error) {
      console.error("Error saving shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del turno",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!shift) return;
    
    setIsDeleting(true);
    
    try {
      await shiftService.delete(shift.id);
      
      toast({
        title: "Turno eliminato",
        description: "Il turno è stato eliminato con successo",
      });
      
      // Refresh shifts data
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del turno",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {shift ? "Modifica Turno" : "Nuovo Turno"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employee" className="text-right">
                Dipendente
              </Label>
              <div className="col-span-3">
                <Select 
                  value={employeeId} 
                  onValueChange={setEmployeeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona dipendente" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem 
                        key={employee.id} 
                        value={employee.id}
                      >
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Data
              </Label>
              <div className="col-span-3">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Ora Inizio
              </Label>
              <div className="col-span-3">
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                Ora Fine
              </Label>
              <div className="col-span-3">
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Note
              </Label>
              <div className="col-span-3">
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note opzionali"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <div className="flex gap-2">
              {shift && (
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Elimina
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="secondary" size="sm">
                  Annulla
                </Button>
              </DialogClose>
              
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  "Salva"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Turno</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo turno?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                "Elimina"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
