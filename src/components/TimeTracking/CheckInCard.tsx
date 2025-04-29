
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { TimeTrackingEntry, timeTrackingService } from "@/lib/time-tracking-service";
import { ClockIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { it } from "date-fns/locale";

interface CheckInCardProps {
  employeeId: string;
  onStatusChange?: () => void;
}

export function CheckInCard({ employeeId, onStatusChange }: CheckInCardProps) {
  const [timeEntry, setTimeEntry] = useState<TimeTrackingEntry | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false);
  const [checkOutLoading, setCheckOutLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  const today = format(new Date(), "yyyy-MM-dd");
  
  useEffect(() => {
    if (!employeeId) return;
    
    const fetchTimeEntry = async () => {
      try {
        setLoading(true);
        const entry = await timeTrackingService.getTimeTrackingEntry(employeeId, today);
        setTimeEntry(entry);
        if (entry?.notes) {
          setNotes(entry.notes);
        }
      } catch (error) {
        console.error("Error fetching time entry:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati di check-in.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeEntry();
  }, [employeeId, today, toast]);
  
  const handleCheckIn = async () => {
    try {
      setCheckInLoading(true);
      const entry = await timeTrackingService.checkIn(employeeId, notes || undefined);
      setTimeEntry(entry);
      toast({
        title: "Check-in effettuato",
        description: `Check-in registrato alle ${format(new Date(), "HH:mm")}`,
      });
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      toast({
        title: "Errore",
        description: "Impossibile registrare il check-in.",
        variant: "destructive",
      });
    } finally {
      setCheckInLoading(false);
    }
  };
  
  const handleCheckOut = async () => {
    try {
      setCheckOutLoading(true);
      const entry = await timeTrackingService.checkOut(employeeId, notes || undefined);
      setTimeEntry(entry);
      toast({
        title: "Check-out effettuato",
        description: `Check-out registrato alle ${format(new Date(), "HH:mm")}`,
      });
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Error during check-out:", error);
      toast({
        title: "Errore",
        description: "Impossibile registrare il check-out.",
        variant: "destructive",
      });
    } finally {
      setCheckOutLoading(false);
    }
  };
  
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "—";
    return format(new Date(isoString), "HH:mm");
  };
  
  const formatDuration = (hours: number | null) => {
    if (hours === null) return "—";
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${wholeHours}h`;
    } else {
      return `${wholeHours}h ${minutes}m`;
    }
  };
  
  const formatDate = (date: Date) => {
    return format(date, "EEEE d MMMM", { locale: it });
  };
  
  const isCheckedIn = Boolean(timeEntry?.checkIn);
  const isCheckedOut = Boolean(timeEntry?.checkOut);
  const totalHours = timeEntry?.totalHours;
  
  return (
    <Card className="shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <ClockIcon className="mr-2 h-5 w-5" />
          Registra Presenza
          <span className="text-sm text-muted-foreground font-normal ml-auto">
            {formatDate(new Date())}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Check-in</p>
            <p className="font-semibold text-lg">
              {isCheckedIn ? (
                <span className="flex items-center">
                  <CheckCircleIcon className="mr-1 h-4 w-4 text-green-500" />
                  {formatTime(timeEntry?.checkIn)}
                </span>
              ) : (
                <span className="flex items-center">
                  <XCircleIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                  Non effettuato
                </span>
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Check-out</p>
            <p className="font-semibold text-lg">
              {isCheckedOut ? (
                <span className="flex items-center">
                  <CheckCircleIcon className="mr-1 h-4 w-4 text-green-500" />
                  {formatTime(timeEntry?.checkOut)}
                </span>
              ) : (
                <span className="flex items-center">
                  <XCircleIcon className="mr-1 h-4 w-4 text-muted-foreground" />
                  Non effettuato
                </span>
              )}
            </p>
          </div>
        </div>
        
        {isCheckedIn && isCheckedOut && (
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Ore Totali</p>
            <p className="text-xl font-bold">{formatDuration(totalHours)}</p>
          </div>
        )}
        
        <Separator className="my-3" />
        
        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium">
            Note (opzionale)
          </label>
          <Textarea
            id="notes"
            placeholder="Aggiungi note sulla giornata lavorativa..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none"
            rows={2}
          />
        </div>
      </CardContent>
      <CardFooter className="flex space-x-2 pt-0">
        <Button
          onClick={handleCheckIn}
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={isCheckedIn || checkInLoading}
          loading={checkInLoading}
        >
          {isCheckedIn ? "Già registrato" : "Check-in"}
        </Button>
        <Button
          onClick={handleCheckOut}
          className="flex-1 bg-amber-600 hover:bg-amber-700"
          disabled={isCheckedOut || checkOutLoading}
          loading={checkOutLoading}
        >
          {isCheckedOut ? "Già registrato" : "Check-out"}
        </Button>
      </CardFooter>
    </Card>
  );
}
