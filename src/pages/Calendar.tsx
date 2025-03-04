
import { MonthlyCalendar } from "@/components/Calendar/MonthlyCalendar";
import { WeeklyCalendar } from "@/components/Calendar/WeeklyCalendar";
import { useEffect, useState } from "react";
import { Employee, ShiftTemplate } from "@/lib/types";
import { employeeService, templateService } from "@/lib/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { CalendarPlus, User } from "lucide-react";
import { ShiftAssignmentModal } from "@/components/Shifts/ShiftAssignmentModal";

const Calendar = () => {
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isWeekView, setIsWeekView] = useState(isMobile);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeeData = await employeeService.getEmployees();
        setEmployees(employeeData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    
    const fetchTemplates = async () => {
      try {
        const templateData = await templateService.getTemplates();
        setTemplates(templateData);
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };
    
    fetchEmployees();
    fetchTemplates();
  }, []);

  // Update view when mobile status changes
  useEffect(() => {
    setIsWeekView(isMobile);
  }, [isMobile]);
  
  const handleViewChange = (weekView: boolean) => {
    setIsWeekView(weekView);
  };
  
  const handleEmployeeClick = (employee: Employee) => {
    if (isAdmin()) {
      setSelectedEmployee(employee);
      setIsAssignmentModalOpen(true);
    }
  };
  
  const handleAssignmentComplete = () => {
    setIsAssignmentModalOpen(false);
    // Refresh the calendar view to show the new shifts
    if (isWeekView) {
      // Force a re-render of the weekly calendar
      const weeklyCalendarElement = document.querySelector('[data-component="weekly-calendar"]');
      if (weeklyCalendarElement) {
        // This will trigger a re-render of the weekly calendar
        weeklyCalendarElement.classList.add('refresh-trigger');
        setTimeout(() => {
          weeklyCalendarElement.classList.remove('refresh-trigger');
        }, 100);
      }
    } else {
      // Force a re-render of the monthly calendar
      const monthlyCalendarElement = document.querySelector('[data-component="monthly-calendar"]');
      if (monthlyCalendarElement) {
        // This will trigger a re-render of the monthly calendar
        monthlyCalendarElement.classList.add('refresh-trigger');
        setTimeout(() => {
          monthlyCalendarElement.classList.remove('refresh-trigger');
        }, 100);
      }
    }
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {isAdmin() && (
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Dipendenti
            </h2>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-2 pr-3">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => handleEmployeeClick(employee)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8" style={{ backgroundColor: employee.color }}>
                        <span className="text-xs font-medium text-white">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {employee.firstName} {employee.lastName}
                      </span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10"
                    >
                      <CalendarPlus className="h-3 w-3" />
                      <span className="text-xs">Assegna</span>
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
      
      <div className="flex-grow space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Calendario Turni</h1>
          <p className="text-gray-500">Visualizza e gestisci i turni dei dipendenti</p>
        </div>
        
        {isWeekView ? (
          <WeeklyCalendar onViewChange={handleViewChange} key="weekly" data-component="weekly-calendar" />
        ) : (
          <MonthlyCalendar onViewChange={handleViewChange} key="monthly" data-component="monthly-calendar" />
        )}
      </div>
      
      {isAssignmentModalOpen && selectedEmployee && (
        <ShiftAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={() => setIsAssignmentModalOpen(false)}
          employee={selectedEmployee}
          templates={templates}
          currentMonth={new Date()}
          onShiftsAdded={handleAssignmentComplete}
        />
      )}
    </div>
  );
};

export default Calendar;
