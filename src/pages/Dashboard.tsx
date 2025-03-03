
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";
import { WeeklyCalendar } from "@/components/Calendar/WeeklyCalendar";
import { useAuth } from "@/hooks/useAuth";
import { WeekTemplatesList } from "@/components/WeekTemplates/WeekTemplatesList";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [isWeekView, setIsWeekView] = useState(false);
  
  const handleViewChange = (isWeekView: boolean) => {
    setIsWeekView(isWeekView);
  };
  
  return (
    <div className="container py-6 space-y-6 animate-in fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visualizza e gestisci i turni di lavoro.
        </p>
      </div>
      
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendario Turni</TabsTrigger>
          {isAdmin() && <TabsTrigger value="templates">Modelli Settimanali</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6">
          {isWeekView ? (
            <WeeklyCalendar onViewChange={handleViewChange} />
          ) : (
            <MonthlyCalendar onViewChange={handleViewChange} />
          )}
        </TabsContent>
        
        {isAdmin() && (
          <TabsContent value="templates" className="mt-6">
            <WeekTemplatesList />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
