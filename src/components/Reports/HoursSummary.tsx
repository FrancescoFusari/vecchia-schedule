
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
import { calculateTotalHours, getWeekDates, formatDate } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BarChart4, CalendarDays } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface HoursSummaryProps {
  shifts: Shift[];
  employees: Employee[];
  currentDate: Date;
}

export function HoursSummary({ shifts, employees, currentDate }: HoursSummaryProps) {
  const [activeTab, setActiveTab] = useState<"week" | "month">("week");
  const isMobile = useIsMobile();
  
  // Calculate week summary
  const weekSummary = useMemo(() => {
    const { start: weekStart, end: weekEnd } = getWeekDates(currentDate);
    const weekStartStr = formatDate(weekStart);
    const weekEndStr = formatDate(weekEnd);
    
    const weekShifts = shifts.filter(shift => {
      return shift.date >= weekStartStr && shift.date <= weekEndStr;
    });
    
    const summary: WeekSummary[] = employees.map(employee => {
      const totalHours = calculateTotalHours(weekShifts, employee.id);
      return {
        employeeId: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        totalHours,
        weekStart,
        weekEnd
      };
    });
    
    // Sort by total hours (descending)
    return summary.sort((a, b) => b.totalHours - a.totalHours);
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
  const totalWeekHours = weekSummary.reduce((sum, item) => sum + item.totalHours, 0);
  const totalMonthHours = monthSummary.reduce((sum, item) => sum + item.totalHours, 0);

  // Prepare chart data
  const chartData = activeTab === "week" 
    ? weekSummary.map(item => ({
        name: `${item.firstName} ${item.lastName.charAt(0)}.`,
        hours: item.totalHours
      }))
    : monthSummary.map(item => ({
        name: `${item.firstName} ${item.lastName.charAt(0)}.`,
        hours: item.totalHours
      }));
  
  return (
    <Card className="overflow-hidden transition-colors duration-300 card-gradient-purple">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <BarChart4 className="h-5 w-5 text-purple-500" />
          <span>Riepilogo Ore</span>
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
          
          <div className="px-4 pt-3 pb-2">
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    fontSize={10}
                    tick={{ fill: 'var(--foreground)', fontSize: 10 }}
                  />
                  <YAxis 
                    fontSize={10} 
                    tick={{ fill: 'var(--foreground)', fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="hours" 
                    fill="var(--primary)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <TabsContent value="week" className="m-0">
            <Table className="table-zebra">
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead className="text-right">Ore</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekSummary.map((summary) => (
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
                  <TableCell className="text-right font-bold font-mono text-purple-600 dark:text-purple-400">{totalWeekHours}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
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
