
import { useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Employee, Shift } from "@/lib/types";

interface HoursSummaryProps {
  employees: Employee[];
  shifts: Shift[];
  currentDate: Date;
}

export function HoursSummary({ employees, shifts, currentDate }: HoursSummaryProps) {
  const [activeTab, setActiveTab] = useState("week");
  
  // Get current week and month boundaries
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Filter shifts for current week
  const weeklyShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= weekStart && shiftDate <= weekEnd;
  });
  
  // Filter shifts for current month
  const monthlyShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= monthStart && shiftDate <= monthEnd;
  });
  
  // Calculate hours for each employee for the week
  const weeklyHours = employees.map(employee => {
    const employeeShifts = weeklyShifts.filter(shift => shift.employeeId === employee.id);
    const totalHours = employeeShifts.reduce((acc, shift) => acc + shift.duration, 0);
    
    return {
      employee,
      totalHours,
      shifts: employeeShifts
    };
  }).filter(summary => summary.totalHours > 0);
  
  // Calculate hours for each employee for the month
  const monthlyHours = employees.map(employee => {
    const employeeShifts = monthlyShifts.filter(shift => shift.employeeId === employee.id);
    const totalHours = employeeShifts.reduce((acc, shift) => acc + shift.duration, 0);
    
    return {
      employee,
      totalHours,
      shifts: employeeShifts
    };
  }).filter(summary => summary.totalHours > 0);
  
  // Sort by total hours (descending)
  weeklyHours.sort((a, b) => b.totalHours - a.totalHours);
  monthlyHours.sort((a, b) => b.totalHours - a.totalHours);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Riepilogo Ore</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="week" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">
              Settimana {format(weekStart, "d")} - {format(weekEnd, "d MMM", { locale: it })}
            </TabsTrigger>
            <TabsTrigger value="month">
              Mese: {format(currentDate, "MMMM", { locale: it })}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="week">
            {weeklyHours.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dipendente</TableHead>
                    <TableHead className="text-right">Ore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyHours.map(({ employee, totalHours }) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </TableCell>
                      <TableCell className="text-right">{totalHours.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-6 text-muted-foreground">
                Nessun turno questa settimana
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="month">
            {monthlyHours.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dipendente</TableHead>
                    <TableHead className="text-right">Ore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyHours.map(({ employee, totalHours }) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </TableCell>
                      <TableCell className="text-right">{totalHours.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-6 text-muted-foreground">
                Nessun turno questo mese
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default HoursSummary;
