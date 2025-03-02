
import { Shift, Employee } from "@/lib/types";
import { cn, formatEmployeeName } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Clock } from "lucide-react";

interface ShiftItemProps {
  shift: Shift;
  employee: Employee;
  onClick?: () => void;
  isStandardTime?: boolean;
}

export function ShiftItem({ shift, employee, onClick, isStandardTime = false }: ShiftItemProps) {
  const { isAdmin } = useAuth();
  const duration = shift.duration;
  
  // Choose color based on standard time or not
  let bgColor = isStandardTime 
    ? "bg-blue-100 text-blue-800" 
    : "bg-amber-100 text-amber-800";
  
  // Apply duration-based styling for non-standard shifts
  if (!isStandardTime) {
    if (duration > 8) {
      bgColor = "bg-purple-100 text-purple-800";
    } else if (duration > 6) {
      bgColor = "bg-indigo-100 text-indigo-800";
    } else if (duration <= 4) {
      bgColor = "bg-green-100 text-green-800";
    }
  }
  
  const shiftContent = isStandardTime 
    ? formatEmployeeName(employee.firstName, employee.lastName)
    : (
      <div className="flex items-center gap-1">
        <span className="truncate">{formatEmployeeName(employee.firstName, employee.lastName)}</span>
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">{shift.startTime}-{shift.endTime}</span>
      </div>
    );
  
  if (isAdmin() && onClick) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={onClick}
              className={cn(
                "shift-item px-2 py-1 mb-1 rounded-md text-xs font-medium truncate flex justify-between items-center",
                bgColor,
                "hover:cursor-pointer hover:brightness-95 transition-all"
              )}
            >
              <div className="truncate flex-1">
                {shiftContent}
              </div>
              <Edit className="h-3 w-3 flex-shrink-0 ml-1 opacity-50" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{formatEmployeeName(employee.firstName, employee.lastName)}</p>
            <p>{shift.startTime}-{shift.endTime} ({duration} ore)</p>
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
            {shiftContent}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{formatEmployeeName(employee.firstName, employee.lastName)}</p>
          <p>{shift.startTime}-{shift.endTime} ({duration} ore)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
