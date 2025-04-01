
import { Shift, Employee } from "@/lib/types";
import { cn, formatEmployeeName, formatTo12Hour } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ShiftItemProps {
  shift: Shift;
  employee: Employee;
  onClick?: () => void;
}

export function ShiftItem({ shift, employee, onClick }: ShiftItemProps) {
  const { isAdmin } = useAuth();
  const duration = shift.duration;
  
  // Use employee color with fallback to duration-based colors
  const employeeColor = employee.color || "#9CA3AF";
  
  // Generate color styles based on employee color
  const bgColor = `bg-opacity-20 text-opacity-90 border border-opacity-20 dark:bg-opacity-25 dark:text-opacity-95 dark:border-opacity-30`;
  const customStyle = {
    backgroundColor: `${employeeColor}20`, // 20% opacity
    color: employeeColor,
    borderColor: `${employeeColor}30`, // 30% opacity
  };
  
  // Format times to show only hours
  const formattedStartTime = formatTo12Hour(shift.startTime);
  const formattedEndTime = formatTo12Hour(shift.endTime);
  
  if (isAdmin() && onClick) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={onClick}
              className={cn(
                "shift-item px-2 py-1 mb-1 rounded-md text-xs font-medium truncate",
                bgColor,
                "hover:cursor-pointer hover:brightness-95 transition-all"
              )}
              style={customStyle}
            >
              <div className="truncate">
                {formatEmployeeName(employee.firstName, employee.lastName)} {formattedStartTime}-{formattedEndTime}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Modifica turno</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div
      className={cn(
        "shift-item px-2 py-1 mb-1 rounded-md text-xs font-medium truncate",
        bgColor,
        "cursor-default"
      )}
      style={customStyle}
    >
      {formatEmployeeName(employee.firstName, employee.lastName)} {formattedStartTime}-{formattedEndTime}
    </div>
  );
}
