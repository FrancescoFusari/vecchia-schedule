
import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";
import { WeeklyCalendar } from "@/components/Calendar/WeeklyCalendar";
import { useEffect, useState } from "react";
import { Employee } from "@/lib/types";
import { employeeService } from "@/lib/supabase";

const Dashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isWeekView, setIsWeekView] = useState(false);
  
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
  
  const handleViewChange = (weekView: boolean) => {
    setIsWeekView(weekView);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario Turni</h1>
        <p className="text-gray-500">Visualizza e gestisci i turni dei dipendenti</p>
      </div>
      
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
        <WeeklyCalendar />
      ) : (
        <MonthlyCalendar onViewChange={handleViewChange} />
      )}
    </div>
  );
}

export default Dashboard;
