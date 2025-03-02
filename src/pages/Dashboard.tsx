
import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario Turni</h1>
        <p className="text-gray-500">Visualizza e gestisci i turni dei dipendenti</p>
        <div className="mt-2 text-sm text-gray-500">
          <span className="inline-block px-2 py-0.5 bg-gray-100 rounded mr-2">Giorni feriali: Orario standard</span>
          <span className="inline-block px-2 py-0.5 bg-gray-100 rounded">Weekend: +30 minuti</span>
        </div>
      </div>
      
      <MonthlyCalendar />
    </div>
  );
};

export default Dashboard;
