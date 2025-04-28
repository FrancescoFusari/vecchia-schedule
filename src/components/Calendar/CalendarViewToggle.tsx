
import { Button } from "@/components/ui/button";

interface CalendarViewToggleProps {
  isWeekView: boolean;
  isVerticalView: boolean;
  onViewChange: (weekView: boolean) => void;
}

export const CalendarViewToggle = ({
  isWeekView,
  isVerticalView,
  onViewChange
}: CalendarViewToggleProps) => {
  if (isVerticalView) return null;
  
  return (
    <div className="flex space-x-2 mb-4">
      <Button
        variant={isWeekView ? "default" : "outline"}
        onClick={() => onViewChange(true)}
      >
        Settimana
      </Button>
      <Button
        variant={!isWeekView ? "default" : "outline"}
        onClick={() => onViewChange(false)}
      >
        Mese
      </Button>
    </div>
  );
};
