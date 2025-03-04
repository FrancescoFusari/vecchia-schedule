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
import { CalendarPlus, ChevronDown, ChevronRight, User } from "lucide-react";
import { ShiftAssignmentModal } from "@/components/Shifts/ShiftAssignmentModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Calendar = () => {
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isWeekView, setIsWeekView] = useState(isMobile);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isEmployeeListOpen, setIsEmployeeListOpen] = useState(true);

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
    if (isWeekView) {
      const weeklyCalendarElement = document.querySelector('[data-component="weekly-calendar"]');
      if (weeklyCalendarElement) {
        weeklyCalendarElement.classList.add('refresh-trigger');
        setTimeout(() => {
          weeklyCalendarElement.classList.remove('refresh-trigger');
        }, 100);
      }
    } else {
      const monthlyCalendarElement = document.querySelector('[data-component="monthly-calendar"]');
      if (monthlyCalendarElement) {
        monthlyCalendarElement.classList.add('refresh-trigger');
        setTimeout(() => {
          monthlyCalendarElement.classList.remove('refresh-trigger');
        }, 100);
      }
    }
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario Turni</h1>
        <p className="text-gray-500">Visualizza e gestisci i turni dei dipendenti</p>
      </div>

      {isAdmin() && (
        <Collapsible
          open={isEmployeeListOpen}
          onOpenChange={setIsEmployeeListOpen}
          className="w-full bg-white rounded-lg shadow border border-gray-200"
        >
          <div className="p-4 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Dipendenti
            </h2>
            <CollapsibleTrigger className="p-1.5 rounded-md hover:bg-gray-100">
              {isEmployeeListOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <ScrollArea className="w-full">
                <div className="flex space-x-3 pb-1 pr-4">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex flex-col items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors min-w-[80px]"
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      <Avatar className="h-12 w-12 mb-2 flex items-center justify-center" style={{ backgroundColor: employee.color }}>
                        <span className="text-sm font-medium text-white">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </Avatar>
                      <span className="text-xs font-medium text-center">
                        {employee.firstName} {employee.lastName}
                      </span>
                      <Badge
                        variant="outline"
                        className="mt-2 flex items-center gap-1 bg-primary/5 hover:bg-primary/10 text-primary"
                      >
                        <CalendarPlus className="h-3 w-3" />
                        <span className="text-xs">Assegna</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      <div className="flex-grow">
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
