
import { useAuth } from "@/hooks/useAuth";
import { Employee } from "@/lib/types";
import { EmployeeBottomSheet } from "@/components/Employees/EmployeeBottomSheet";

interface CalendarPageHeaderProps {
  employees: Employee[];
  onEmployeeSelect: (employee: Employee) => void;
}

export const CalendarPageHeader = ({ 
  employees, 
  onEmployeeSelect 
}: CalendarPageHeaderProps) => {
  const { isAdmin } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold">Calendario Turni</h1>
      <p className="text-muted-foreground">Visualizza e gestisci i turni dei dipendenti</p>
      
      {isAdmin() && (
        <div className="flex items-center justify-between mt-4">
          <EmployeeBottomSheet 
            employees={employees} 
            onEmployeeSelect={onEmployeeSelect}
            isAdmin={isAdmin()}
          />
        </div>
      )}
    </div>
  );
};
