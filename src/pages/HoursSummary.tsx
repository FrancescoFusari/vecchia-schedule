
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Employee, Shift } from "@/lib/types";
import { shiftService } from "@/lib/supabase";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { HoursSummary as HoursSummaryComponent } from "@/components/Reports/HoursSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const HoursSummaryPage = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch employee data and shifts
  useEffect(() => {
    const fetchEmployeeAndShifts = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Find the employee profile for the current user
        const employeeData = await shiftService.getEmployeeById(user.id);
        
        if (employeeData) {
          setEmployee(employeeData);
          
          // Fetch shifts for this employee
          await fetchShifts(employeeData.id);
        } else {
          toast({
            title: "Profilo non trovato",
            description: "Non è stato trovato un profilo dipendente associato al tuo account.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante il caricamento dei dati.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeAndShifts();
  }, [user]);
  
  // Fetch shifts when date changes
  useEffect(() => {
    if (employee) {
      fetchShifts(employee.id);
    }
  }, [currentDate, employee]);
  
  const fetchShifts = async (employeeId: string) => {
    try {
      setLoading(true);
      
      const startDate = startOfMonth(new Date(currentDate));
      // Get shifts for a larger date range to include the full month
      startDate.setMonth(startDate.getMonth() - 1);
      
      const endDate = endOfMonth(new Date(currentDate));
      endDate.setMonth(endDate.getMonth() + 1);
      
      const fetchedShifts = await shiftService.getEmployeeShifts(
        employeeId,
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );
      
      setShifts(fetchedShifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il caricamento dei turni.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  
  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Riepilogo Ore</h1>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Mese Prec.
          </Button>
          <div className="font-medium px-2">
            {format(currentDate, "MMMM yyyy")}
          </div>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            Mese Succ.
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : employee ? (
        <HoursSummaryComponent 
          shifts={shifts} 
          employees={employee ? [employee] : []} 
          currentDate={currentDate} 
        />
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p>Nessun profilo dipendente trovato per questo account.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HoursSummaryPage;
