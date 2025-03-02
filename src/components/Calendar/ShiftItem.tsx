
import { Shift, Employee } from "@/lib/types";
import { cn, formatEmployeeName } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit } from "lucide-react";

interface ShiftItemProps {
  shift: Shift;
  employee: Employee;
  onClick?: () => void;
}

export function ShiftItem({ shift, employee, onClick }: ShiftItemProps) {
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
              <div className="truncate">
                {formatEmployeeName(employee.firstName, employee.lastName)} {shift.startTime}-{shift.endTime}
              </div>
              <Edit className="h-3 w-3 flex-shrink-0 ml-1 opacity-50" />
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
    >
      {formatEmployeeName(employee.firstName, employee.lastName)} {shift.startTime}-{shift.endTime}
    </div>
  );
}
