
import { DAYS_OF_WEEK } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CalendarColumnHeaderProps {
  dayIndex: number;
  isWeekend: boolean;
}

export function CalendarColumnHeader({ dayIndex, isWeekend }: CalendarColumnHeaderProps) {
  const standardTime = isWeekend ? "17:00-23:00" : "12:00-17:00";
  
  return (
    <div className="flex flex-col items-center border-b border-gray-200 pb-1">
      <div className="font-semibold text-sm">
        {DAYS_OF_WEEK[dayIndex]}
      </div>
      <div className={cn(
        "text-xs mt-1 px-2 py-0.5 rounded-full",
        isWeekend ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
      )}>
        {standardTime}
      </div>
    </div>
  );
}
