
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";
import { HoursSummary } from "@/components/Reports/HoursSummary";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { shiftService, employeeService } from "@/lib/supabase";
import { Employee, Shift } from "@/lib/types";

export default function Calendar() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch employees
  const { 
    data: employees = [], 
    isLoading: isLoadingEmployees,
    error: employeesError 
  } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeService.getAll,
    enabled: !!user
  });

  // Fetch shifts
  const { 
    data: shifts = [], 
    isLoading: isLoadingShifts,
    error: shiftsError 
  } = useQuery({
    queryKey: ['shifts'],
    queryFn: shiftService.getAll,
    enabled: !!user
  });

  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  // Show loading state when authentication is being verified
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Caricamento...</span>
      </div>
    );
  }

  // Handle loading and error states
  if (isLoadingEmployees || isLoadingShifts) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Caricamento dati...</span>
        </div>
      </div>
    );
  }

  if (employeesError || shiftsError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>
            Si è verificato un errore durante il caricamento dei dati. 
            Per favore, riprova più tardi.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handlePreviousMonth} 
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <CardTitle className="text-xl md:text-2xl font-semibold">
                  {format(currentDate, "MMMM yyyy", { locale: it })}
                </CardTitle>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleNextMonth} 
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <MonthlyCalendar 
                currentDate={currentDate}
                shifts={shifts}
                employees={employees}
                isAdmin={isAdmin()}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <HoursSummary 
            employees={employees}
            shifts={shifts}
            currentDate={currentDate}
          />
        </div>
      </div>
    </div>
  );
}
