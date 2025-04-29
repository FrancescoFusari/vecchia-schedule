
import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { TimeTrackingEntry, timeTrackingService } from "@/lib/time-tracking-service";
import { ClockIcon, CheckCircleIcon, XCircleIcon, CalendarIcon } from "lucide-react";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface CheckInCardProps {
  employeeId: string;
  onStatusChange?: () => void;
}

const timeSchema = z.object({
  date: z.date({ required_error: "Data richiesta" }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato ora valido richiesto (HH:MM)"),
  notes: z.string().optional()
});

type TimeFormValues = z.infer<typeof timeSchema>;

export function CheckInCard({ employeeId, onStatusChange }: CheckInCardProps) {
  const [timeEntry, setTimeEntry] = useState<TimeTrackingEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false);
  const [checkOutLoading, setCheckOutLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  const today = format(new Date(), "yyyy-MM-dd");
  
  const checkInForm = useForm<TimeFormValues>({
    resolver: zodResolver(timeSchema),
    defaultValues: {
      date: new Date(),
      time: format(new Date(), "HH:mm"),
      notes: ""
    }
  });
  
  const checkOutForm = useForm<TimeFormValues>({
    resolver: zodResolver(timeSchema),
    defaultValues: {
      date: new Date(),
      time: format(new Date(), "HH:mm"),
      notes: ""
    }
  });
  
  useEffect(() => {
    if (!employeeId) return;
    
    const fetchTimeEntry = async () => {
      try {
        setLoading(true);
        const entry = await timeTrackingService.getTimeTrackingEntry(employeeId, today);
        setTimeEntry(entry);
        if (entry) {
          // Set existing notes to both forms
          if (entry.notes) {
            checkInForm.setValue("notes", entry.notes);
            checkOutForm.setValue("notes", entry.notes);
          }
          
          // If there's a check-in time, update the check-out form date
          if (entry.checkIn) {
            const checkInDate = new Date(entry.checkIn);
            checkOutForm.setValue("date", checkInDate);
            checkOutForm.setValue("time", format(checkInDate, "HH:mm"));
          }
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
  
  const handleCheckIn = async (data: TimeFormValues) => {
    try {
      setCheckInLoading(true);
      
      // Combine date and time into a single DateTime
      const dateTimeStr = `${format(data.date, "yyyy-MM-dd")}T${data.time}:00`;
      const dateTime = new Date(dateTimeStr);
      
      // Check if the date is valid
      if (isNaN(dateTime.getTime())) {
        toast({
          title: "Errore",
          description: "Data o ora non valida.",
          variant: "destructive",
        });
        return;
      }
      
      const entry = await timeTrackingService.checkInWithTime(
        employeeId, 
        dateTime,
        data.notes || undefined
      );
      
      setTimeEntry(entry);
      toast({
        title: "Check-in effettuato",
        description: `Check-in registrato alle ${format(dateTime, "HH:mm")} del ${format(dateTime, "dd/MM/yyyy")}`,
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
  
  const handleCheckOut = async (data: TimeFormValues) => {
    try {
      setCheckOutLoading(true);
      
      // Combine date and time into a single DateTime
      const dateTimeStr = `${format(data.date, "yyyy-MM-dd")}T${data.time}:00`;
      const dateTime = new Date(dateTimeStr);
      
      // Check if the date is valid
      if (isNaN(dateTime.getTime())) {
        toast({
          title: "Errore",
          description: "Data o ora non valida.",
          variant: "destructive",
        });
        return;
      }
      
      // Make sure check-out is after check-in if there's a check-in time
      if (timeEntry?.checkIn) {
        const checkInTime = new Date(timeEntry.checkIn).getTime();
        if (dateTime.getTime() <= checkInTime) {
          toast({
            title: "Errore",
            description: "L'orario di check-out deve essere successivo al check-in.",
            variant: "destructive",
          });
          return;
        }
      }
      
      const entry = await timeTrackingService.checkOutWithTime(
        employeeId, 
        dateTime,
        data.notes || undefined
      );
      
      setTimeEntry(entry);
      toast({
        title: "Check-out effettuato",
        description: `Check-out registrato alle ${format(dateTime, "HH:mm")} del ${format(dateTime, "dd/MM/yyyy")}`,
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
                  <span className="text-xs ml-1 text-muted-foreground">
                    {timeEntry?.checkIn && format(new Date(timeEntry.checkIn), "dd/MM")}
                  </span>
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
                  <span className="text-xs ml-1 text-muted-foreground">
                    {timeEntry?.checkOut && format(new Date(timeEntry.checkOut), "dd/MM")}
                  </span>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Check-in Form */}
          <Form {...checkInForm}>
            <form onSubmit={checkInForm.handleSubmit(handleCheckIn)} className="space-y-4">
              <h3 className="font-medium text-sm">Check-in</h3>
              
              <FormField
                control={checkInForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isCheckedIn}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Seleziona data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={isCheckedIn}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
              
              <FormField
                control={checkInForm.control}
                name="time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ora</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        disabled={isCheckedIn}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={checkInForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Note (opzionale)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Note sull'attività..."
                        className="resize-none"
                        rows={2}
                        disabled={isCheckedIn && isCheckedOut}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isCheckedIn || checkInLoading}
                loading={checkInLoading}
              >
                {isCheckedIn ? "Già registrato" : "Registra Check-in"}
              </Button>
            </form>
          </Form>
          
          {/* Check-out Form */}
          <Form {...checkOutForm}>
            <form onSubmit={checkOutForm.handleSubmit(handleCheckOut)} className="space-y-4">
              <h3 className="font-medium text-sm">Check-out</h3>
              
              <FormField
                control={checkOutForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isCheckedOut}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Seleziona data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={isCheckedOut}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
              
              <FormField
                control={checkOutForm.control}
                name="time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ora</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        disabled={isCheckedOut}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={checkOutForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Note (opzionale)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Note sull'attività..."
                        className="resize-none"
                        rows={2}
                        disabled={isCheckedIn && isCheckedOut}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={isCheckedOut || checkOutLoading}
                loading={checkOutLoading}
              >
                {isCheckedOut ? "Già registrato" : "Registra Check-out"}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
