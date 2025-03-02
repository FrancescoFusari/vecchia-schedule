
import { useState, useEffect } from "react";
import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";
import { Employee, Shift } from "@/lib/types";
import { employeeService, shiftService } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Load employees
        const employeeData = await employeeService.getAll();
        setEmployees(employeeData);
        
        // Load shifts (all for admin, only user's for employees)
        let shiftData: Shift[];
        if (isAdmin()) {
          shiftData = await shiftService.getAll();
        } else if (user) {
          shiftData = await shiftService.getEmployeeShifts(user.id);
        } else {
          shiftData = [];
        }
        setShifts(shiftData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Errore di caricamento",
          description: "Si è verificato un errore durante il caricamento dei dati.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [isAdmin, user, toast]);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario Turni</h1>
        <p className="text-gray-500">Visualizza e gestisci i turni dei dipendenti</p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <MonthlyCalendar
          currentDate={new Date()}
          shifts={shifts}
          employees={employees}
          isAdmin={isAdmin()}
        />
      )}
    </div>
  );
};

export default Dashboard;
