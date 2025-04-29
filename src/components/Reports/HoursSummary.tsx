
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
  
  return (
    <Card className="overflow-hidden transition-colors duration-300">
      <CardHeader className="bg-card border-b pb-3">
        <CardTitle>Riepilogo Ore</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "week" | "month")}>
          <div className="border-b px-4 py-2">
            <TabsList className={`grid ${isMobile ? 'w-full' : 'w-[200px]'} grid-cols-2`}>
              <TabsTrigger value="week">Settimana</TabsTrigger>
              <TabsTrigger value="month">Mese</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="week" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead className="text-right">Ore Totali</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekSummary.map((summary) => (
                  <TableRow key={summary.employeeId}>
                    <TableCell className="font-medium">
                      {summary.firstName} {summary.lastName}
                    </TableCell>
                    <TableCell className="text-right">
                      {summary.totalHours > 0 ? summary.totalHours : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Totale</TableCell>
                  <TableCell className="text-right font-bold">{totalWeekHours}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="month" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead className="text-right">Ore Totali</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthSummary.map((summary) => (
                  <TableRow key={summary.employeeId}>
                    <TableCell className="font-medium">
                      {summary.firstName} {summary.lastName}
                    </TableCell>
                    <TableCell className="text-right">
                      {summary.totalHours > 0 ? summary.totalHours : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Totale</TableCell>
                  <TableCell className="text-right font-bold">{totalMonthHours}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
