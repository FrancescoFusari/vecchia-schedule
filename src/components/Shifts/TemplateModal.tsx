
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShiftTemplate } from "@/lib/types";
import { calculateShiftDuration, generateId } from "@/lib/utils";
import { templateService } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ShiftTemplate | null;
  onSave: (template: ShiftTemplate) => void;
  onDelete: (templateId: string) => void;
}

export function TemplateModal({ isOpen, onClose, template, onSave, onDelete }: TemplateModalProps) {
  const [name, setName] = useState(template?.name || "");
  const [startTime, setStartTime] = useState(template?.startTime || "");
  const [endTime, setEndTime] = useState(template?.endTime || "");
  const [duration, setDuration] = useState(template?.duration || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate duration when times change
  useEffect(() => {
    if (startTime && endTime) {
      const calculatedDuration = calculateShiftDuration(startTime, endTime);
      setDuration(calculatedDuration);
    }
  }, [startTime, endTime]);
  
  const validateForm = () => {
    if (!name) {
      toast({
        title: "Errore di validazione",
        description: "Inserisci un nome per il template.",
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
  
  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      const updatedTemplate: ShiftTemplate = {
        id: template?.id || generateId(),
        name,
        startTime,
        endTime,
        duration,
        createdAt: template?.createdAt || new Date().toISOString()
      };
      
      await onSave(updatedTemplate);
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del template.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (template) {
      try {
        setIsSubmitting(true);
        await onDelete(template.id);
      } catch (error) {
        console.error("Error deleting template:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante l'eliminazione del template.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {template ? "Modifica template" : "Aggiungi template"}
          </DialogTitle>
          <DialogDescription>
            {template ? "Modifica i dettagli del template esistente." : "Aggiungi un nuovo template di turno."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="es. Mattina, Sera, ecc."
              disabled={isSubmitting}
            />
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
        </div>
        
        <DialogFooter className="flex justify-between">
          {template && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isSubmitting}>Elimina</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione eliminerà definitivamente il template e non può essere annullata.
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
          
          <div>
            <Button variant="outline" onClick={onClose} className="mr-2" disabled={isSubmitting}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2">Salvataggio...</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                "Salva"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
