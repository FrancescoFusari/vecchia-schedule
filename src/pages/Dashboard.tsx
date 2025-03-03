
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { WeekTemplatesList } from "@/components/WeekTemplates/WeekTemplatesList";
import { HoursSummary } from "@/components/Reports/HoursSummary";
import { useState, useEffect } from "react";
import { employeeService, shiftService } from "@/lib/supabase";
import { Employee, Shift } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate] = useState(new Date());
  
  // Fetch employees and shifts for the current month
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get first and last day of current month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Format dates for API
        const startDate = formatDate(firstDay);
        const endDate = formatDate(lastDay);
        
        // Fetch employees and shifts in parallel
        const [employeesData, shiftsData] = await Promise.all([
          employeeService.getEmployees(),
          shiftService.getShifts(startDate, endDate)
        ]);
        
        setEmployees(employeesData);
        setShifts(shiftsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentDate]);
  
  return (
    <div className="container py-6 space-y-6 animate-in fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Gestisci dipendenti, orari e visualizza i report.
        </p>
      </div>
      
      <Tabs defaultValue="hours">
        <TabsList>
          <TabsTrigger value="hours">Riepilogo Ore</TabsTrigger>
          {isAdmin() && <TabsTrigger value="templates">Modelli Settimanali</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="hours" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <HoursSummary 
              shifts={shifts} 
              employees={employees} 
              currentDate={currentDate} 
            />
          )}
        </TabsContent>
        
        {isAdmin() && (
          <TabsContent value="templates" className="mt-6">
            <WeekTemplatesList />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
