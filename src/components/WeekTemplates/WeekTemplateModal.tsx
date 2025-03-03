
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shift, Employee } from "@/lib/types";
import { weekTemplateService } from "@/services/weekTemplateService";
import { employeeService, shiftService } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface WeekTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function WeekTemplateModal({ isOpen, onClose, onSave }: WeekTemplateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Get employees
      const employeeData = await employeeService.getEmployees();
      setEmployees(employeeData);
      
      // Set default date range for this week
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ...
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Calculate days to Monday
      const sundayOffset = currentDay === 0 ? 0 : 7 - currentDay; // Calculate days to Sunday
      
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      
      const sunday = new Date(today);
      sunday.setDate(today.getDate() + sundayOffset);
      
      setStartDate(formatDate(monday));
      setEndDate(formatDate(sunday));
      
      // Get shifts for the current week
      const shiftsData = await shiftService.getShifts(formatDate(monday), formatDate(sunday));
      setShifts(shiftsData);
      setFilteredShifts(shiftsData);
    } catch (error) {
      console.error("Error fetching data for template creation:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il caricamento dei dati.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      // Filter shifts for the selected date range
      const filtered = shifts.filter(shift => {
        return shift.date >= startDate && shift.date <= endDate;
      });
      setFilteredShifts(filtered);
    }
  }, [startDate, endDate, shifts]);

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      setStartDate(value);
      // Ensure end date is not before start date
      if (endDate < value) {
        setEndDate(value);
      }
    } else {
      setEndDate(value);
      // Ensure start date is not after end date
      if (startDate > value) {
        setStartDate(value);
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare template data
      const templateData = {
        name,
        description,
        startDate,
        endDate
      };
      
      // Prepare template shifts from filtered shifts
      const templateShifts = filteredShifts.map(shift => ({
        employeeId: shift.employeeId,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        duration: shift.duration,
        notes: shift.notes
      }));
      
      // Create the template
      const createdTemplate = await weekTemplateService.createTemplate(templateData, templateShifts);
      
      if (createdTemplate) {
        toast({
          title: "Modello creato",
          description: "Il modello settimanale è stato creato con successo.",
        });
        onSave();
      }
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la creazione del modello.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      toast({
        title: "Errore di validazione",
        description: "Inserisci un nome per il modello.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!startDate) {
      toast({
        title: "Errore di validazione",
        description: "Seleziona una data di inizio.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!endDate) {
      toast({
        title: "Errore di validazione",
        description: "Seleziona una data di fine.",
        variant: "destructive",
      });
      return false;
    }
    
    if (filteredShifts.length === 0) {
      toast({
        title: "Errore di validazione",
        description: "Non ci sono turni nel periodo selezionato.",
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Crea Modello Settimanale</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
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
                placeholder="Nome del modello settimanale"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrizione
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Descrizione opzionale"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Data inizio
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Data fine
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Turni selezionati ({filteredShifts.length})</h3>
              <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                {filteredShifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    Nessun turno trovato nel periodo selezionato.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {filteredShifts.map((shift) => (
                      <li key={shift.id} className="text-sm border-b last:border-b-0 py-1">
                        {new Date(shift.date).toLocaleDateString()} - {getEmployeeName(shift.employeeId)} ({shift.startTime}-{shift.endTime})
                      </li>
                    ))}
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
                <span className="mr-2">Salvataggio...</span>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </>
            ) : (
              "Salva"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
