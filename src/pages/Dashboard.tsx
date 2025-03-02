
import { useState } from "react";
import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";
import { addMonths, subMonths } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Shift, Employee } from "@/lib/types";

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { isAdmin } = useAuth();
  // These would typically come from an API call or context
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario Turni</h1>
        <p className="text-gray-500">Visualizza e gestisci i turni dei dipendenti</p>
      </div>
      
      <MonthlyCalendar 
        currentDate={currentDate}
        shifts={shifts}
        employees={employees}
        isAdmin={isAdmin()}
      />
    </div>
  );
};

export default Dashboard;
