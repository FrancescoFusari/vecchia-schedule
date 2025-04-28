
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Employee, ShiftTemplate } from "@/lib/types";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface ShiftAssignmentConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employee: Employee | null;
  template?: ShiftTemplate;
  selectedDays?: Date[];
  weekdays?: number[];
  weekdayMonth?: Date;
  isSubmitting?: boolean;
  shifts?: Array<{ date: Date, template: ShiftTemplate }>;
}

export function ShiftAssignmentConfirmation({
  isOpen,
  onClose,
  onConfirm,
  employee,
  template,
  selectedDays = [],
  weekdays = [],
  weekdayMonth,
  isSubmitting = false,
  shifts = [],
}: ShiftAssignmentConfirmationProps) {
  const [totalShifts, setTotalShifts] = useState(0);
  const dayLabels = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

  // Determine which set of data to use
  const shiftsToShow = shifts.length > 0 ? shifts : [];
  const hasLegacyData = Boolean(template && (selectedDays.length > 0 || weekdays.length > 0));
  
  useEffect(() => {
    if (shifts.length > 0) {
      setTotalShifts(shifts.length);
    } else {
      const weekdayCount = weekdays.length > 0 && weekdayMonth
        ? new Date(weekdayMonth.getFullYear(), weekdayMonth.getMonth() + 1, 0).getDate() 
        : 0;
      const specificDaysCount = selectedDays.length;
      setTotalShifts(weekdayCount + specificDaysCount);
    }
  }, [weekdays, selectedDays, weekdayMonth, shifts]);

  const handleConfirmClick = () => {
    // Make sure onConfirm is called when the button is clicked
    if (onConfirm) {
      console.log("Confirmation dialog: Calling onConfirm callback");
      onConfirm();
    }
  };

  const handleCancelClick = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isSubmitting) {
        handleCancelClick();
      }
    }}>
      <AlertDialogContent className="max-w-md sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Conferma assegnazione turni</AlertDialogTitle>
          <AlertDialogDescription>
            Stai per assegnare i seguenti turni:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <ScrollArea className="h-[300px] sm:h-[400px] rounded-md border p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Dipendente</h3>
              <p className="text-sm text-muted-foreground">
                {employee ? `${employee.firstName} ${employee.lastName}` : "Nessun dipendente selezionato"}
              </p>
            </div>

            {(hasLegacyData && template) && (
              <div className="space-y-2">
                <h3 className="font-medium">Tipo di turno</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{template.name}</p>
                  <Badge variant="secondary">{template.startTime} - {template.endTime}</Badge>
                </div>
              </div>
            )}

            {shifts.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Turni da assegnare</h3>
                <div className="flex flex-wrap gap-2">
                  {shifts.map((shift, index) => (
                    <div key={index} className="border p-2 rounded-md w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          {format(shift.date, 'd MMMM', { locale: it })}
                        </span>
                        <Badge variant="outline">
                          {shift.template.startTime.slice(0, 5)} - {shift.template.endTime.slice(0, 5)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {shift.template.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {weekdays.length > 0 && weekdayMonth && (
              <div className="space-y-2">
                <h3 className="font-medium">Giorni della settimana</h3>
                <div className="flex flex-wrap gap-2">
                  {weekdays.map((day) => (
                    <Badge key={day} variant="outline">
                      {dayLabels[day]}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Nel mese di {format(weekdayMonth, 'MMMM yyyy', { locale: it })}
                </p>
              </div>
            )}

            {selectedDays.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Giorni specifici</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDays.map((date) => (
                    <Badge key={date.toISOString()} variant="outline">
                      {format(date, 'd MMMM', { locale: it })}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Totale turni</h3>
                <Badge>{totalShifts} turni</Badge>
              </div>
            </div>
          </div>
        </ScrollArea>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancelClick} disabled={isSubmitting}>
            Annulla
          </Button>
          <Button 
            onClick={handleConfirmClick}
            disabled={isSubmitting}
            autoFocus
          >
            {isSubmitting ? "Assegnazione..." : "Conferma"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
