
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { Shift, ShiftTemplate, Employee } from "@/lib/types";
import { employeeService, shiftService, templateService } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;
        
        setLoading(true);
        
        // Get templates first since we'll need them for the analysis
        const templateData = await templateService.getTemplates();
        setTemplates(templateData);
        
        // Find the employee record linked to the current user
        const employees = await employeeService.getEmployees();
        const userEmployee = employees.find(emp => emp.userId === user.id);
        
        if (userEmployee) {
          setEmployee(userEmployee);
          
          // Fetch shifts for this employee for the current month
          const start = startOfMonth(currentMonth);
          const end = endOfMonth(currentMonth);
          
          const shiftData = await shiftService.getShifts(
            start.toISOString().split('T')[0],
            end.toISOString().split('T')[0]
          );
          
          // Filter shifts for only this employee
          setShifts(shiftData.filter(shift => shift.employeeId === userEmployee.id));
        } else {
          toast({
            title: "Informazione",
            description: "Il tuo account non è collegato a nessun dipendente.",
          });
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante il caricamento dei dati.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, currentMonth]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il logout.",
        variant: "destructive",
      });
    }
  };

  // Calculate weekly hours
  const calculateWeeklyHours = () => {
    if (!shifts.length) return [];
    
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const weeks = eachWeekOfInterval(
      { start, end }, 
      { weekStartsOn: 1 } // 1 = Monday
    );
    
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekShifts = shifts.filter(
        shift => 
          new Date(shift.date) >= startOfWeek(weekStart, { weekStartsOn: 1 }) && 
          new Date(shift.date) <= weekEnd
      );
      
      const totalHours = weekShifts.reduce(
        (sum, shift) => sum + parseFloat(shift.duration.toString()), 
        0
      );
      
      const templateUsage = templates.reduce((acc, template) => {
        const count = weekShifts.filter(shift => 
          shift.startTime === template.startTime && 
          shift.endTime === template.endTime
        ).length;
        if (count > 0) {
          acc[template.name] = count;
        }
        return acc;
      }, {} as Record<string, number>);
      
      return {
        weekStart,
        weekEnd,
        hours: totalHours,
        templateUsage,
        shifts: weekShifts
      };
    });
  };

  const weeklyHours = calculateWeeklyHours();
  
  // Calculate total monthly hours
  const totalMonthlyHours = shifts.reduce(
    (sum, shift) => sum + parseFloat(shift.duration.toString()), 
    0
  );
  
  // Group shifts by date for the schedule view
  const groupShiftsByDate = () => {
    const grouped: Record<string, Shift[]> = {};
    
    shifts.forEach(shift => {
      if (!grouped[shift.date]) {
        grouped[shift.date] = [];
      }
      grouped[shift.date].push(shift);
    });
    
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, shifts]) => ({
        date,
        shifts
      }));
  };
  
  const shiftsByDate = groupShiftsByDate();
  const currentMonthName = format(currentMonth, 'MMMM yyyy', { locale: it });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Profilo Personale</h1>
          <p className="text-gray-500">
            {employee ? `${employee.firstName} ${employee.lastName}` : 'Dipendente'}
          </p>
        </div>
        
        <Button 
          variant="destructive" 
          className="w-full sm:w-auto flex items-center" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Informazioni Personali</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <p className="text-sm text-gray-500">Nome</p>
            <p className="font-medium">{user?.firstName || employee?.firstName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cognome</p>
            <p className="font-medium">{user?.lastName || employee?.lastName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Username</p>
            <p className="font-medium">{user?.username || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user?.email || employee?.email || 'N/A'}</p>
          </div>
          {employee?.position && (
            <div>
              <p className="text-sm text-gray-500">Posizione</p>
              <p className="font-medium">{employee.position}</p>
            </div>
          )}
          {employee?.phone && (
            <div>
              <p className="text-sm text-gray-500">Telefono</p>
              <p className="font-medium">{employee.phone}</p>
            </div>
          )}
        </div>
      </div>
      
      {employee ? (
        <Tabs defaultValue="schedule" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule" className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Turni</span>
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Ore</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader className="bg-primary/5 py-4 border-b">
                <CardTitle className="text-xl font-semibold">
                  I tuoi turni - {currentMonthName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">Caricamento turni...</p>
                  </div>
                ) : shifts.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">Nessun turno programmato per questo mese.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {shiftsByDate.map(({ date, shifts }) => (
                      <div key={date} className="p-4">
                        <h3 className="font-medium text-lg mb-2">
                          {format(parseISO(date), "EEEE d MMMM", { locale: it })}
                        </h3>
                        <div className="space-y-3">
                          {shifts.map((shift) => (
                            <div 
                              key={shift.id} 
                              className="p-3 rounded-md border border-gray-200 bg-gray-50"
                              style={{ 
                                borderLeftWidth: "4px",
                                borderLeftColor: employee?.color || "#9CA3AF" 
                              }}
                            >
                              <p className="font-medium">
                                {shift.startTime} - {shift.endTime}
                              </p>
                              <p className="text-sm text-gray-500">
                                Durata: {shift.duration} ore
                              </p>
                              {shift.notes && (
                                <p className="text-sm mt-1 text-gray-600">
                                  Note: {shift.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader className="bg-primary/5 py-4 border-b">
                <CardTitle className="text-xl flex justify-between items-center">
                  <span>Ore lavorate - {currentMonthName}</span>
                  {!loading && (
                    <span className="text-lg font-bold">
                      Totale: {totalMonthlyHours.toFixed(1)} ore
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">Caricamento dati...</p>
                  </div>
                ) : weeklyHours.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">Nessun dato per questo mese.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Settimana</TableHead>
                        <TableHead>Ore</TableHead>
                        <TableHead>Dettagli</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyHours.map((week, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {format(week.weekStart, "dd/MM", { locale: it })} - {format(week.weekEnd, "dd/MM", { locale: it })}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {week.hours.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(week.templateUsage).map(([template, count], i) => (
                                <Badge 
                                  key={i} 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{
                                    borderColor: employee?.color ? `${employee.color}50` : undefined,
                                    backgroundColor: employee?.color ? `${employee.color}15` : undefined
                                  }}
                                >
                                  {template}: {count}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Caricamento dati...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">
              Il tuo account non è collegato a nessun profilo dipendente. 
              Contatta l'amministratore per collegare il tuo account.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;
