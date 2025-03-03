
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { WeekTemplatesList } from "@/components/WeekTemplates/WeekTemplatesList";
import { HoursSummary } from "@/components/Reports/HoursSummary";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  
  return (
    <div className="container py-6 space-y-6 animate-in fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Gestisci dipendenti, orari e visualizza i report.
        </p>
      </div>
      
      <Tabs defaultValue="hours">
        <TabsList>
          <TabsTrigger value="hours">Riepilogo Ore</TabsTrigger>
          {isAdmin() && <TabsTrigger value="templates">Modelli Settimanali</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="hours" className="mt-6">
          <HoursSummary />
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
