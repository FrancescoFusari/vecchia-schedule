
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";
import { WeeklyCalendar } from "@/components/Calendar/WeeklyCalendar";
import { useEffect } from "react";
import { Employee } from "@/lib/types";
import { employeeService } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { LogOut, Users, Clock } from "lucide-react";
import { Employees } from "@/components/Dashboard/Employees";
import { Templates } from "@/components/Dashboard/Templates";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const isMobile = useIsMobile();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isWeekView, setIsWeekView] = useState(isMobile);
  const [activeTab, setActiveTab] = useState("calendar");
  const { user, signOut, isAdmin } = useAuth();
  
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeeData = await employeeService.getEmployees();
        setEmployees(employeeData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    
    fetchEmployees();
  }, []);
  
  // Update view when mobile status changes
  useEffect(() => {
    setIsWeekView(isMobile);
  }, [isMobile]);
  
  const handleViewChange = (weekView: boolean) => {
    setIsWeekView(weekView);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout effettuato",
        description: "Hai effettuato il logout con successo.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="flex items-center">
          {user && (
            <div className="mr-4 text-sm text-gray-600">
              Benvenuto, {user.firstName || user.username}
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start mb-6 border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="calendar" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
          >
            Calendario Turni
          </TabsTrigger>
          
          {isAdmin() && (
            <>
              <TabsTrigger 
                value="employees" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                <Users className="mr-2 h-4 w-4 inline" />
                Dipendenti
              </TabsTrigger>
              
              <TabsTrigger 
                value="templates" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
              >
                <Clock className="mr-2 h-4 w-4 inline" />
                Template Turni
              </TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="calendar" className="mt-0">
          <div className="space-y-4">
            <p className="text-gray-500">Visualizza e gestisci i turni dei dipendenti</p>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {employees.map(employee => (
                <div 
                  key={employee.id} 
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: `${employee.color || "#9CA3AF"}20`,
                    color: employee.color || "#4B5563",
                    borderLeft: `3px solid ${employee.color || "#9CA3AF"}`
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: employee.color || "#9CA3AF" }}
                  ></div>
                  {employee.firstName} {employee.lastName}
                </div>
              ))}
            </div>
            
            {isWeekView ? (
              <WeeklyCalendar onViewChange={handleViewChange} />
            ) : (
              <MonthlyCalendar onViewChange={handleViewChange} />
            )}
          </div>
        </TabsContent>
        
        {isAdmin() && (
          <>
            <TabsContent value="employees" className="mt-0">
              <Employees />
            </TabsContent>
            
            <TabsContent value="templates" className="mt-0">
              <Templates />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Dashboard;
