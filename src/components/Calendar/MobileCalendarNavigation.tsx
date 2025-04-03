
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface MobileCalendarNavigationProps {
  visibleDays: number[];
  formattedDates: Array<{
    date: Date;
    dayOfMonth: number;
    isToday: boolean;
  }>;
  onPrevDays: () => void;
  onNextDays: () => void;
}

export function MobileCalendarNavigation({
  visibleDays,
  formattedDates,
  onPrevDays,
  onNextDays
}: MobileCalendarNavigationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
      <Button variant="outline" size="sm" onClick={onPrevDays} className="h-8 w-8 p-0">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-sm font-medium flex items-center gap-1">
        <Calendar className="h-4 w-4" />
        {visibleDays.map(dayIndex => 
          <span key={dayIndex} className={`${formattedDates[dayIndex].isToday ? 'text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded' : ''}`}>
            {formattedDates[dayIndex].dayOfMonth}
          </span>
        ).reduce((prev, curr, i) => [prev, <span key={`sep-${i}`} className="text-muted-foreground mx-0.5">-</span>, curr] as any)}
      </div>
      <Button variant="outline" size="sm" onClick={onNextDays} className="h-8 w-8 p-0">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
