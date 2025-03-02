import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";
import { WeeklyCalendar } from "@/components/Calendar/WeeklyCalendar";
import { useEffect, useState } from "react";
import { Employee } from "@/lib/types";
import { employeeService } from "@/lib/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
const Calendar = () => {
  const isMobile = useIsMobile();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isWeekView, setIsWeekView] = useState(isMobile);
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
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario Turni</h1>
        <p className="text-gray-500">Visualizza e gestisci i turni dei dipendenti</p>
      </div>
      
      
      
      {isWeekView ? <WeeklyCalendar onViewChange={handleViewChange} /> : <MonthlyCalendar onViewChange={handleViewChange} />}
    </div>;
};
export default Calendar;