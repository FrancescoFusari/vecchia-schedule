import { useState, useEffect } from "react";
import { format, parse, isValid, addDays, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { TimeTrackingEntry, timeTrackingService, TimeRegistrationData } from "@/lib/time-tracking-service";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClockIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
interface TimeRegistrationCardProps {
  employeeId: string;
  onStatusChange?: () => void;
}
const timeRegistrationSchema = z.object({
  date: z.date({
    required_error: "Data richiesta"
  }),
  checkInTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato ora valido richiesto (HH:MM)"),
  checkOutTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato ora valido richiesto (HH:MM)"),
  notes: z.string().optional()
}).refine(data => {
  // Parse times to compare them
  const [inHour, inMinute] = data.checkInTime.split(':').map(Number);
  const [outHour, outMinute] = data.checkOutTime.split(':').map(Number);
  return outHour > inHour || outHour === inHour && outMinute > inMinute;
}, {
  message: "L'orario di uscita deve essere successivo all'orario di entrata",
  path: ["checkOutTime"]
});
type TimeRegistrationFormValues = z.infer<typeof timeRegistrationSchema>;
export function TimeRegistrationCard({
  employeeId,
  onStatusChange
}: TimeRegistrationCardProps) {
  const [currentEntry, setCurrentEntry] = useState<TimeTrackingEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const form = useForm<TimeRegistrationFormValues>({
    resolver: zodResolver(timeRegistrationSchema),
    defaultValues: {
      date: new Date(),
      checkInTime: "09:00",
      checkOutTime: "17:00",
      notes: ""
    }
  });

  // Fetch the time entry for the selected date
  useEffect(() => {
    const fetchTimeEntry = async () => {
      if (!employeeId) return;
      try {
        setLoading(true);
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const entry = await timeTrackingService.getTimeTrackingEntry(employeeId, dateStr);
        setCurrentEntry(entry);
        if (entry) {
          // If entry exists, populate the form with its values
          if (entry.checkIn) {
            const checkInDate = new Date(entry.checkIn);
            form.setValue("checkInTime", format(checkInDate, "HH:mm"));
          }
          if (entry.checkOut) {
            const checkOutDate = new Date(entry.checkOut);
            form.setValue("checkOutTime", format(checkOutDate, "HH:mm"));
          }
          if (entry.notes) {
            form.setValue("notes", entry.notes);
          }
        } else {
          // Reset to default values if no entry exists
          form.setValue("checkInTime", "09:00");
          form.setValue("checkOutTime", "17:00");
          form.setValue("notes", "");
        }
      } catch (error) {
        console.error("Error fetching time entry:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati del giorno selezionato.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTimeEntry();
  }, [employeeId, selectedDate, toast, form]);

  // Handler for date navigation
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    form.setValue("date", newDate);
  };
  const handlePrevDay = () => {
    const newDate = subDays(selectedDate, 1);
    handleDateChange(newDate);
  };
  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    handleDateChange(newDate);
  };
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date && isValid(date)) {
      handleDateChange(date);
    }
  };

  // Submit handler
  const onSubmit = async (data: TimeRegistrationFormValues) => {
    try {
      setSubmitting(true);
      const registrationData: TimeRegistrationData = {
        date: data.date,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        notes: data.notes
      };
      const entry = await timeTrackingService.registerTimeEntry(employeeId, registrationData);
      setCurrentEntry(entry);
      toast({
        title: "Registrazione completata",
        description: `Ore registrate per il ${format(data.date, "dd/MM/yyyy")}.`
      });
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error: any) {
      console.error("Error registering time entry:", error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile registrare le ore.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  const formatTime = (time: string | null) => {
    if (!time) return "—";
    return time;
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
  const isDateRegistered = Boolean(currentEntry?.checkIn && currentEntry?.checkOut);
  return <Card className="shadow-md transition-all duration-300 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/30 dark:to-card">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-xl flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ClockIcon className="mr-2 h-5 w-5 text-purple-500" />
              Registra Ore
            </div>
          </div>
          
          {/* Calendar controls on a new line */}
          <div className={cn("flex items-center justify-center mt-1", isMobile ? "w-full" : "justify-end")}>
            <Button variant="ghost" size="sm" onClick={handlePrevDay} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("pl-3 pr-2 py-1 h-8 font-normal text-sm flex items-center justify-between", isMobile ? "flex-1 max-w-[200px]" : "")}>
                  {format(selectedDate, "EEEE d MMMM", {
                  locale: it
                })}
                  <CalendarIcon className="ml-2 h-4 w-4 text-purple-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar mode="single" selected={selectedDate} onSelect={handleCalendarSelect} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="sm" onClick={handleNextDay} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-4 px-[12px] py-[12px]">
        {/* Status indicator */}
        <div className={cn("p-3 rounded-md", isDateRegistered ? "bg-green-50/70 dark:bg-green-900/20 border border-green-200 dark:border-green-900" : "bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900")}>
          <div className="flex items-center">
            {isDateRegistered ? <>
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-500 mr-2" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Ore già registrate</p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    {formatTime(form.getValues("checkInTime"))} - {formatTime(form.getValues("checkOutTime"))} 
                    {currentEntry?.totalHours && ` (${formatDuration(currentEntry.totalHours)})`}
                  </p>
                </div>
              </> : <>
                <XCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">Ore non registrate</p>
                  <p className="text-sm text-amber-600 dark:text-amber-500">
                    Compila il modulo per registrare le ore di questo giorno
                  </p>
                </div>
              </>}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Hidden date field - handled through the date picker UI */}
            <FormField control={form.control} name="date" render={({
            field
          }) => <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} value={field.value?.toISOString() || ''} />
                  </FormControl>
                </FormItem>} />
            
            <div className="grid grid-cols-2 gap-4">
              {/* Check-in time */}
              <FormField control={form.control} name="checkInTime" render={({
              field
            }) => <FormItem>
                    <FormLabel>Orario Entrata</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="border-purple-200 dark:border-purple-800/50 focus-visible:ring-purple-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              
              {/* Check-out time */}
              <FormField control={form.control} name="checkOutTime" render={({
              field
            }) => <FormItem>
                    <FormLabel>Orario Uscita</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="border-purple-200 dark:border-purple-800/50 focus-visible:ring-purple-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>
            
            {/* Notes */}
            <FormField control={form.control} name="notes" render={({
            field
          }) => <FormItem>
                  <FormLabel>Note (opzionale)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Note sull'attività di lavoro..." className="resize-none border-purple-200 dark:border-purple-800/50 focus-visible:ring-purple-500" rows={2} {...field} />
                  </FormControl>
                </FormItem>} />
            
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={loading || submitting} loading={submitting}>
              {isDateRegistered ? "Aggiorna Registrazione" : "Registra Presenza"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>;
}