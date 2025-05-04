
import { Shift, Employee } from "@/lib/types";
import { cn, formatEmployeeName, formatTo12Hour } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock } from "lucide-react";

interface ShiftItemProps {
  shift: Shift;
  employee: Employee;
  onClick?: () => void;
  highlight?: boolean;
  isFilterActive?: boolean;
}

export function ShiftItem({ shift, employee, onClick, highlight = false, isFilterActive = false }: ShiftItemProps) {
  const { isAdmin } = useAuth();
  const duration = shift.duration;
  
  // Use employee color with fallback to duration-based colors
  const employeeColor = employee.color || "#9CA3AF";
  
  // Generate color styles based on employee color
  const bgColor = `bg-opacity-20 text-opacity-90 border border-opacity-20 dark:bg-opacity-25 dark:text-opacity-95 dark:border-opacity-30`;
  const customStyle = {
    backgroundColor: highlight ? `${employeeColor}40` : `${employeeColor}20`, // 40% opacity when highlighted
    color: employeeColor,
    borderColor: highlight ? `${employeeColor}70` : `${employeeColor}30`, // 70% opacity when highlighted
  };
  
  // Format times to include minutes
  const formattedStartTime = formatTo12Hour(shift.startTime);
  const formattedEndTime = formatTo12Hour(shift.endTime);
  
  // Add animation classes when filtering is active
  const filterActiveClasses = isFilterActive ? 
    "px-3 py-2 mb-2 text-sm transition-all animate-in fade-in duration-300 hover:scale-[1.03]" : 
    "px-2 py-1 mb-1 text-xs";
  
  if (isAdmin() && onClick) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={onClick}
              className={cn(
                "shift-item rounded-md font-medium flex justify-between items-center",
                bgColor,
                "hover:cursor-pointer hover:brightness-95 transition-all",
                highlight ? "ring-1 ring-primary/30" : "",
                filterActiveClasses
              )}
              style={customStyle}
            >
              <div className="truncate">
                {formatEmployeeName(employee.firstName, employee.lastName)}
              </div>
              <div className={cn(
                "flex items-center gap-1 bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap ml-1",
                isFilterActive ? "text-xs" : "text-[10px]"
              )}>
                <Clock className={isFilterActive ? "h-3 w-3" : "h-2.5 w-2.5"} />
                <span>{formattedStartTime}-{formattedEndTime}</span>
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
        "shift-item rounded-md font-medium flex justify-between items-center",
        bgColor,
        "cursor-default",
        highlight ? "ring-1 ring-primary/30" : "",
        filterActiveClasses
      )}
      style={customStyle}
    >
      <div className="truncate">
        {formatEmployeeName(employee.firstName, employee.lastName)}
      </div>
      <div className={cn(
        "flex items-center gap-1 bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap ml-1",
        isFilterActive ? "text-xs" : "text-[10px]"
      )}>
        <Clock className={isFilterActive ? "h-3 w-3" : "h-2.5 w-2.5"} />
        <span>{formattedStartTime}-{formattedEndTime}</span>
      </div>
    </div>
  );
}
