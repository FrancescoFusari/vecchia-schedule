
import { ChevronLeft, ChevronRight, CalendarDays, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CalendarHeaderProps {
  date: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  isWeekView?: boolean;
  onViewChange?: (isWeekView: boolean) => void;
}

export function CalendarHeader({ 
  date, 
  onPrevMonth, 
  onNextMonth, 
  onToday, 
  isWeekView = false,
  onViewChange 
}: CalendarHeaderProps) {
  // Get the week number and format title
  const getWeekOfMonth = (date: Date): number => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    // Calculate days from the beginning of the month
    const days = Math.floor((date.getTime() - firstDayOfMonth.getTime()) / (24 * 60 * 60 * 1000));
    // Get the week number (add 1 because we want to start from week 1)
    return Math.ceil((days + firstDayOfMonth.getDay()) / 7);
  };
  
  // Format title based on view type
  const title = isWeekView 
    ? `${date.toLocaleString('it', { month: 'long' })} - Week ${getWeekOfMonth(date)}` 
    : formatMonthYear(date);
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={onPrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-lg font-medium">
          {title}
        </div>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={onNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          className="ml-2"
          onClick={onToday}
        >
          Oggi
        </Button>
      </div>
      
      {onViewChange && (
        <div className="flex items-center space-x-2">
          <CalendarDays className={`h-4 w-4 ${!isWeekView ? "text-primary" : "text-gray-400"}`} />
          <Switch
            id="view-mode"
            checked={isWeekView}
            onCheckedChange={onViewChange}
          />
          <Label htmlFor="view-mode" className="flex items-center gap-1">
            <CalendarClock className={`h-4 w-4 ${isWeekView ? "text-primary" : "text-gray-400"}`} />
            <span className="text-sm">Vista settimanale</span>
          </Label>
        </div>
      )}
    </div>
  );
}
