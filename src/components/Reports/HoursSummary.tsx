
import { useState, useMemo } from "react";
import { Shift, Employee, WeekSummary, MonthSummary } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateTotalHours, getWeekDates, formatDate } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BarChart4, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface HoursSummaryProps {
  shifts: Shift[];
  employees: Employee[];
  currentDate: Date;
  onMonthChange: (date: Date) => void;
}

export function HoursSummary({ shifts, employees, currentDate, onMonthChange }: HoursSummaryProps) {
  const [activeTab, setActiveTab] = useState<"week" | "month">("week");
  const isMobile = useIsMobile();
  
  // Handle month navigation
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };
  
  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };
  
  // Calculate all weeks in month summary
  const weeksSummary = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Create array of weeks
    const weeks = [];
    let currentWeekStart = new Date(firstDay);
    
    // Adjust to start from Monday if not already
    const dayOfWeek = currentWeekStart.getDay();
    if (dayOfWeek !== 1) { // If not Monday
      currentWeekStart.setDate(currentWeekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    }
    
    // Generate all weeks that overlap with the month
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekStartStr = formatDate(currentWeekStart);
      const weekEndStr = formatDate(weekEnd);
      
      const weekShifts = shifts.filter(shift => {
        return shift.date >= weekStartStr && shift.date <= weekEndStr;
      });
      
      const weekSummary = employees.map(employee => {
        const totalHours = calculateTotalHours(weekShifts, employee.id);
        return {
          employeeId: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          totalHours,
          weekStart: new Date(currentWeekStart),
          weekEnd: new Date(weekEnd),
          weekLabel: `${formatDate(currentWeekStart).slice(8,10)}/${formatDate(currentWeekStart).slice(5,7)} - ${formatDate(weekEnd).slice(8,10)}/${formatDate(weekEnd).slice(5,7)}`
        };
      });
      
      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(weekEnd),
        summary: weekSummary.sort((a, b) => b.totalHours - a.totalHours)
      });
      
      // Move to next week
      currentWeekStart = new Date(weekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
    }
    
    return weeks;
  }, [shifts, employees, currentDate]);
  
  // Calculate month summary
  const monthSummary = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const monthStartStr = formatDate(monthStart);
    const monthEndStr = formatDate(monthEnd);
    
    const monthShifts = shifts.filter(shift => {
      return shift.date >= monthStartStr && shift.date <= monthEndStr;
    });
    
    const summary: MonthSummary[] = employees.map(employee => {
      const totalHours = calculateTotalHours(monthShifts, employee.id);
      return {
        employeeId: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        totalHours,
        month,
        year
      };
    });
    
    // Sort by total hours (descending)
    return summary.sort((a, b) => b.totalHours - a.totalHours);
  }, [shifts, employees, currentDate]);
  
  // Calculate total hours
  const totalWeekHours = activeTab === "week" ? 
    weeksSummary.reduce((sum, week) => {
      const weekTotal = week.summary.reduce((wSum, item) => wSum + item.totalHours, 0);
      return sum + weekTotal;
    }, 0) : 0;
    
  const totalMonthHours = monthSummary.reduce((sum, item) => sum + item.totalHours, 0);
  
  return (
    <Card className="overflow-hidden transition-colors duration-300 card-gradient-purple">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between text-xl">
          <div className="flex items-center gap-2">
            <BarChart4 className="h-5 w-5 text-purple-500" />
            <span>Riepilogo Ore</span>
          </div>
          
          {/* Month selector control */}
          <div className="flex items-center bg-muted/50 rounded-md p-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handlePrevMonth} 
              className="h-8 w-8 p-0 rounded-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium px-3 min-w-16 text-center">
              {format(currentDate, "MMMM")}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleNextMonth} 
              className="h-8 w-8 p-0 rounded-md"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "week" | "month")}>
          <div className="border-b px-4 py-2">
            <TabsList className={`grid ${isMobile ? 'w-full' : 'w-[200px]'} grid-cols-2`}>
              <TabsTrigger value="week" className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Settimana
              </TabsTrigger>
              <TabsTrigger value="month" className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Mese
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="week" className="m-0">
            {weeksSummary.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="mb-4 last:mb-0">
                <div className="px-4 pt-3 pb-1 bg-muted/30 border-b">
                  <h3 className="text-sm font-medium">{week.summary[0]?.weekLabel || 'Settimana'}</h3>
                </div>
                <Table className="table-zebra">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dipendente</TableHead>
                      <TableHead className="text-right">Ore</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {week.summary.map((summary) => (
                      <TableRow key={`${weekIndex}-${summary.employeeId}`}>
                        <TableCell className="font-medium">
                          {summary.firstName} {summary.lastName}
                        </TableCell>
                        <TableCell className="text-right">
                          {summary.totalHours > 0 ? (
                            <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
                              {summary.totalHours}
                            </span>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {week.summary.length > 0 && (
                      <TableRow className="bg-muted/50 border-t">
                        <TableCell className="font-medium">Totale settimana</TableCell>
                        <TableCell className="text-right font-mono font-medium text-purple-600 dark:text-purple-400">
                          {week.summary.reduce((sum, item) => sum + item.totalHours, 0)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ))}
            {weeksSummary.length > 1 && (
              <Table>
                <TableBody>
                  <TableRow className="bg-muted/50 border-t-2">
                    <TableCell className="font-bold">Totale complessivo</TableCell>
                    <TableCell className="text-right font-bold font-mono text-purple-600 dark:text-purple-400">
                      {totalWeekHours}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          <TabsContent value="month" className="m-0">
            <Table className="table-zebra">
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead className="text-right">Ore</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthSummary.map((summary) => (
                  <TableRow key={summary.employeeId}>
                    <TableCell className="font-medium">
                      {summary.firstName} {summary.lastName}
                    </TableCell>
                    <TableCell className="text-right">
                      {summary.totalHours > 0 ? (
                        <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
                          {summary.totalHours}
                        </span>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 border-t-2">
                  <TableCell className="font-bold">Totale</TableCell>
                  <TableCell className="text-right font-bold font-mono text-purple-600 dark:text-purple-400">{totalMonthHours}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
