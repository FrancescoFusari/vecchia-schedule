import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Employee, Shift } from "@/lib/types";
import { shiftService, employeeService } from "@/lib/supabase";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { HoursSummary as HoursSummaryComponent } from "@/components/Reports/HoursSummary";
import { TimeRegistrationCard } from "@/components/TimeTracking/TimeRegistrationCard";
import { HoursComparison } from "@/components/TimeTracking/HoursComparison";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const HoursSummaryPage = () => {
  const {
    user
  } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("summary");
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  // Fetch employee data and shifts
  useEffect(() => {
    const fetchEmployeeAndShifts = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // Find the employee profile for the current user
        const employees = await employeeService.getEmployees();
        const foundEmployee = employees.find(emp => emp.userId === user.id);
        if (foundEmployee) {
          setEmployee(foundEmployee);

          // Fetch shifts for this employee
          await fetchShifts(foundEmployee.id);
        } else {
          toast({
            title: "Profilo non trovato",
            description: "Non è stato trovato un profilo dipendente associato al tuo account.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante il caricamento dei dati.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeAndShifts();
  }, [user, refreshKey]);

  // Fetch shifts when date changes
  useEffect(() => {
    if (employee) {
      fetchShifts(employee.id);
    }
  }, [currentDate, employee, refreshKey]);
  const fetchShifts = async (employeeId: string) => {
    try {
      setLoading(true);
      const startDate = startOfMonth(new Date(currentDate));
      // Get shifts for a larger date range to include the full month
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = endOfMonth(new Date(currentDate));
      endDate.setMonth(endDate.getMonth() + 1);
      const fetchedShifts = await shiftService.getEmployeeShifts(employeeId, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd"));
      setShifts(fetchedShifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il caricamento dei turni.",
        variant: "destructive"
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
  return <div className="space-y-4 animate-fade-in">
      <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex justify-between'} items-center mb-2`}>
        
        
        <div className="flex items-center bg-muted/50 rounded-md p-1">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0 rounded-md">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium px-3 min-w-20 text-center">
            {format(currentDate, "MMMM yyyy")}
          </div>
          <Button variant="ghost" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0 rounded-md">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add tab navigation for all views for consistency */}
      {employee && <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 w-[300px]'} w-full`}>
            <TabsTrigger value="summary">Riepilogo</TabsTrigger>
            <TabsTrigger value="checkin">Registra Ore</TabsTrigger>
          </TabsList>
        </Tabs>}
      
      {loading ? <Card>
          <CardContent className="py-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card> : employee ? <>
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            {/* Time Registration card */}
            {activeTab === "checkin" && <div className="md:col-span-2">
                <TimeRegistrationCard employeeId={employee.id} onStatusChange={handleRefresh} />
              </div>}
            
            {/* Hours summary content */}
            {activeTab === "summary" && <>
                <div className={isMobile ? "" : "md:col-span-1"}>
                  <HoursSummaryComponent shifts={shifts} employees={employee ? [employee] : []} currentDate={currentDate} />
                </div>
                
                <div className={isMobile ? "" : "md:col-span-1"}>
                  <HoursComparison employee={employee} shifts={shifts} currentDate={currentDate} onRefresh={handleRefresh} />
                </div>
              </>}
          </div>
        </> : <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p>Nessun profilo dipendente trovato per questo account.</p>
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default HoursSummaryPage;