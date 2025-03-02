
import { Shift, Employee } from "@/lib/types";
import { cn, formatEmployeeName } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ShiftItemProps {
  shift: Shift;
  employee: Employee;
  isWeekend?: boolean;
  onClick?: () => void;
}

export function ShiftItem({ shift, employee, isWeekend = false, onClick }: ShiftItemProps) {
  const { isAdmin } = useAuth();
  const duration = shift.duration;
  
  // Choose color based on shift duration
  let bgColor = "bg-blue-100 text-blue-800";
  if (duration > 8) {
    bgColor = "bg-purple-100 text-purple-800";
  } else if (duration > 6) {
    bgColor = "bg-indigo-100 text-indigo-800";
  } else if (duration <= 4) {
    bgColor = "bg-green-100 text-green-800";
  }
  
  // For weekend shifts, we show that they end 30min later
  const displayEndTime = isWeekend ? 
    `${shift.endTime.split(':')[0]}:${(parseInt(shift.endTime.split(':')[1]) + 30) % 60}` : 
    shift.endTime;
  
  const tooltipText = isWeekend ? 
    `${formatEmployeeName(employee.firstName, employee.lastName)} ${shift.startTime}-${displayEndTime} (Weekend +30min)` :
    `${formatEmployeeName(employee.firstName, employee.lastName)} ${shift.startTime}-${shift.endTime}`;
  
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
            >
              <div className="truncate">
                {formatEmployeeName(employee.firstName, employee.lastName)}
                {isWeekend && <span className="ml-1 text-xs opacity-75">+30m</span>}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isWeekend ? "Modifica turno weekend" : "Modifica turno"}</p>
            <p className="text-xs opacity-80">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "shift-item px-2 py-1 mb-1 rounded-md text-xs font-medium truncate",
              bgColor,
              "cursor-default"
            )}
          >
            {formatEmployeeName(employee.firstName, employee.lastName)}
            {isWeekend && <span className="ml-1 text-xs opacity-75">+30m</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
