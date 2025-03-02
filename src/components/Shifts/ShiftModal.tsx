
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shift, Employee, ShiftTemplate } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, calculateShiftDuration, generateId } from "@/lib/utils";
import { DEFAULT_SHIFT_TEMPLATES } from "@/lib/constants";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { templateService } from "@/lib/supabase";

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  date: Date | null;
  employees: Employee[];
  onSave: (shift: Shift) => void;
  onDelete: (shiftId: string) => void;
}

export function ShiftModal({ isOpen, onClose, shift, date, employees, onSave, onDelete }: ShiftModalProps) {
  const [employeeId, setEmployeeId] = useState(shift?.employeeId || "");
  const [shiftDate, setShiftDate] = useState(shift?.date || (date ? formatDate(date) : ""));
  const [startTime, setStartTime] = useState(shift?.startTime || "");
  const [endTime, setEndTime] = useState(shift?.endTime || "");
  const [notes, setNotes] = useState(shift?.notes || "");
  const [duration, setDuration] = useState(shift?.duration || 0);
  
  // Use templates from Supabase if available, otherwise fallback to constants
  const [templates, setTemplates] = useState<ShiftTemplate[]>(DEFAULT_SHIFT_TEMPLATES);
  
  // Fetch templates when modal opens
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesData = await templateService.getTemplates();
        if (templatesData && templatesData.length > 0) {
          setTemplates(templatesData);
        }
      } catch (error) {
        console.error("Error fetching shift templates:", error);
        // Fallback to default templates if fetch fails
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Calculate duration when times change
  useEffect(() => {
    if (startTime && endTime) {
      const calculatedDuration = calculateShiftDuration(startTime, endTime);
      setDuration(calculatedDuration);
    }
  }, [startTime, endTime]);
  
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setStartTime(template.startTime);
      setEndTime(template.endTime);
      setDuration(template.duration);
    }
  };
  
  const handleSave = () => {
    if (!employeeId || !shiftDate || !startTime || !endTime) {
      // Show validation error
      return;
    }
    
    const updatedShift: Shift = {
      id: shift?.id || generateId(),
      employeeId,
      date: shiftDate,
      startTime,
      endTime,
      duration,
      notes,
      createdAt: shift?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    onSave(updatedShift);
  };
  
  const handleDelete = () => {
    if (shift) {
      onDelete(shift.id);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {shift ? "Modifica turno" : "Aggiungi turno"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data
            </Label>
            <Input
              id="date"
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee" className="text-right">
              Dipendente
            </Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
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
            <Label htmlFor="template" className="text-right">
              Template
            </Label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleziona template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
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
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          {shift && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Elimina</Button>
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
                  <AlertDialogAction onClick={handleDelete}>
                    Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <div>
            <Button variant="outline" onClick={onClose} className="mr-2">
              Annulla
            </Button>
            <Button onClick={handleSave}>Salva</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
