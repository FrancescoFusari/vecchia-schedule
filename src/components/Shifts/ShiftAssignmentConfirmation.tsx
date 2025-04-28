
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
  employee: Employee;
  template: ShiftTemplate;
  selectedDays: Date[];
  weekdays: number[];
  weekdayMonth: Date;
  isSubmitting: boolean;
}

export function ShiftAssignmentConfirmation({
  isOpen,
  onClose,
  onConfirm,
  employee,
  template,
  selectedDays,
  weekdays,
  weekdayMonth,
  isSubmitting,
}: ShiftAssignmentConfirmationProps) {
  const [totalShifts, setTotalShifts] = useState(0);
  const dayLabels = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

  useEffect(() => {
    const weekdayCount = weekdays.length > 0 
      ? new Date(weekdayMonth.getFullYear(), weekdayMonth.getMonth() + 1, 0).getDate() 
      : 0;
    const specificDaysCount = selectedDays.length;
    setTotalShifts(weekdayCount + specificDaysCount);
  }, [weekdays, selectedDays, weekdayMonth]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Conferma assegnazione turni</AlertDialogTitle>
          <AlertDialogDescription>
            Stai per assegnare i seguenti turni:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Dipendente</h3>
              <p className="text-sm text-muted-foreground">
                {employee.firstName} {employee.lastName}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Tipo di turno</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{template.name}</p>
                <Badge variant="secondary">{template.startTime} - {template.endTime}</Badge>
              </div>
            </div>

            {weekdays.length > 0 && (
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

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Assegnazione..." : "Conferma"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
