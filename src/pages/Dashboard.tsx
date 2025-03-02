
import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";
import { CalendarLegend } from "@/components/Calendar/CalendarLegend";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario Turni</h1>
        <p className="text-gray-500">Visualizza e gestisci i turni dei dipendenti</p>
      </div>
      
      <CalendarLegend />
      <MonthlyCalendar />
    </div>
  );
};

export default Dashboard;
