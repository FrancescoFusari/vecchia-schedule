
import { Shift, Employee } from "@/lib/types";
import { cn, formatEmployeeName } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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
  
  return (
    <div
      onClick={isAdmin() ? onClick : undefined}
      className={cn(
        "shift-item px-2 py-1 mb-1 rounded-md text-xs font-medium truncate cursor-default",
        bgColor,
        isAdmin() && "hover:cursor-pointer"
      )}
    >
      {formatEmployeeName(employee.firstName, employee.lastName)} {shift.startTime}-{shift.endTime}
    </div>
  );
}
