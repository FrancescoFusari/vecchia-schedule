
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS } from "@/lib/constants";

interface CalendarHeaderProps {
  date: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarHeader({ date, onPrevMonth, onNextMonth, onToday }: CalendarHeaderProps) {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center mb-4 md:mb-0">
        <h2 className="text-2xl font-bold text-gray-900">
          {MONTHS[month]} {year}
        </h2>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          onClick={onToday}
          variant="outline"
          className="rounded-full bg-white shadow-sm border hover:bg-gray-50"
        >
          Oggi
        </Button>
        
        <div className="flex items-center space-x-1 ml-2">
          <Button
            onClick={onPrevMonth}
            variant="outline"
            size="icon"
            className="rounded-full bg-white shadow-sm border hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            onClick={onNextMonth}
            variant="outline"
            size="icon"
            className="rounded-full bg-white shadow-sm border hover:bg-gray-50"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
