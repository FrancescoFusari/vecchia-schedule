
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { TimeTrackingEntry, timeTrackingService } from "@/lib/time-tracking-service";
import { Shift, Employee } from "@/lib/types";
import { calculateTotalHours, formatDate } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ClockIcon, AlertCircle } from "lucide-react";

interface DailyHourData {
  date: string; // ISO format
  scheduledHours: number;
  actualHours: number | null;
  difference: number | null;
}

interface HoursComparisonProps {
  employee: Employee;
  shifts: Shift[];
  currentDate: Date;
  onRefresh?: () => void;
}

export function HoursComparison({ employee, shifts, currentDate, onRefresh }: HoursComparisonProps) {
  const [timeEntries, setTimeEntries] = useState<TimeTrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const isMobile = useIsMobile();
  
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);
  
  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        setLoading(true);
        const startDateStr = formatDate(monthStart);
        const endDateStr = formatDate(monthEnd);
        
        const entries = await timeTrackingService.getEmployeeTimeEntries(
          employee.id,
          startDateStr,
          endDateStr
        );
        
        setTimeEntries(entries);
      } catch (error) {
        console.error("Error fetching time entries:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (employee?.id) {
      fetchTimeEntries();
    }
  }, [employee, monthStart, monthEnd, onRefresh]);
  
  // Calculate daily comparison data
  const dailyData = useMemo(() => {
    if (!shifts || !timeEntries) return [];
    
    // Create a map of shifts by date
    const shiftsByDate = new Map<string, Shift[]>();
    shifts.forEach(shift => {
      if (!shiftsByDate.has(shift.date)) {
        shiftsByDate.set(shift.date, []);
      }
      shiftsByDate.get(shift.date)!.push(shift);
    });
    
    // Create a map of time entries by date
    const entriesByDate = new Map<string, TimeTrackingEntry>();
    timeEntries.forEach(entry => {
      entriesByDate.set(entry.date, entry);
    });
    
    // Generate daily data for the current month
    const result: DailyHourData[] = [];
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get all dates that have either shifts or time entries
    const allDates = new Set([
      ...Array.from(shiftsByDate.keys()),
      ...Array.from(entriesByDate.keys())
    ]);
    
    // Filter to include only dates within the current month
    const currentMonthDates = Array.from(allDates).filter(dateStr => {
      const date = parseISO(dateStr);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).sort();
    
    // Build the daily data
    currentMonthDates.forEach(dateStr => {
      const shiftsForDate = shiftsByDate.get(dateStr) || [];
      const timeEntry = entriesByDate.get(dateStr);
      
      const scheduledHours = shiftsForDate.reduce((sum, shift) => sum + shift.duration, 0);
      const actualHours = timeEntry?.totalHours ?? null;
      
      const difference = actualHours !== null ? actualHours - scheduledHours : null;
      
      result.push({
        date: dateStr,
        scheduledHours,
        actualHours,
        difference
      });
    });
    
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, timeEntries, currentDate]);
  
  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const scheduledHours = dailyData.reduce((sum, day) => sum + day.scheduledHours, 0);
    
    const actualHoursWithValues = dailyData
      .filter(day => day.actualHours !== null)
      .reduce((sum, day) => sum + (day.actualHours || 0), 0);
    
    const totalActualHours = dailyData.some(day => day.actualHours !== null) 
      ? actualHoursWithValues 
      : null;
      
    const difference = totalActualHours !== null ? totalActualHours - scheduledHours : null;
    
    return {
      scheduledHours,
      actualHours: totalActualHours,
      difference
    };
  }, [dailyData]);
  
  const formatHours = (hours: number | null) => {
    if (hours === null) return "—";
    return hours.toFixed(2);
  };
  
  const getDifferenceClass = (difference: number | null) => {
    if (difference === null) return "";
    if (difference > 0) return "text-green-600 dark:text-green-400";
    if (difference < 0) return "text-red-600 dark:text-red-400";
    return "";
  };
  
  const formatDifference = (difference: number | null) => {
    if (difference === null) return "—";
    const sign = difference > 0 ? "+" : "";
    return `${sign}${difference.toFixed(2)}`;
  };
  
  const formatDateDisplay = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM");
  };
  
  return (
    <Card className="shadow-md mt-6 transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <ClockIcon className="mr-2 h-5 w-5" />
          Confronto Ore
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "daily" | "monthly")}
        >
          <div className="border-b px-4 py-2">
            <TabsList className={`grid ${isMobile ? 'w-full' : 'w-[200px]'} grid-cols-2`}>
              <TabsTrigger value="daily">Giorni</TabsTrigger>
              <TabsTrigger value="monthly">Riepilogo</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="daily" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Programmate</TableHead>
                  <TableHead className="text-right">Effettive</TableHead>
                  <TableHead className="text-right">Diff.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyData.length > 0 ? (
                  dailyData.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell>{formatDateDisplay(day.date)}</TableCell>
                      <TableCell className="text-right">{formatHours(day.scheduledHours)}</TableCell>
                      <TableCell className="text-right">{formatHours(day.actualHours)}</TableCell>
                      <TableCell className={`text-right ${getDifferenceClass(day.difference)}`}>
                        {formatDifference(day.difference)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p>Nessun dato disponibile per questo mese</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="monthly" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ore</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Ore Programmate</TableCell>
                  <TableCell className="text-right">{formatHours(monthlyTotals.scheduledHours)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Ore Effettive</TableCell>
                  <TableCell className="text-right">{formatHours(monthlyTotals.actualHours)}</TableCell>
                </TableRow>
                <TableRow className="font-bold">
                  <TableCell>Differenza</TableCell>
                  <TableCell className={`text-right ${getDifferenceClass(monthlyTotals.difference)}`}>
                    {formatDifference(monthlyTotals.difference)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
