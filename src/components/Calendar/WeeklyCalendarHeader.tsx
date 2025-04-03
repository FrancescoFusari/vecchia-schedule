
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { BarChart, ChevronDown, ChevronUp, Eye, EyeOff, User } from "lucide-react";
import { Employee } from "@/lib/types";

interface WeeklyCalendarHeaderProps {
  isAdmin: () => boolean;
  currentUserEmployee: Employee | null;
  expandedWeek: boolean;
  showOnlyUserShifts: boolean;
  onToggleExpandWeek: () => void;
  onToggleUserShifts: () => void;
}

export function WeeklyCalendarHeader({
  isAdmin,
  currentUserEmployee,
  expandedWeek,
  showOnlyUserShifts,
  onToggleExpandWeek,
  onToggleUserShifts
}: WeeklyCalendarHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {isAdmin() && (
        <Button 
          onClick={onToggleExpandWeek} 
          variant="outline" 
          size="sm" 
          className="gap-1 bg-primary/5 border-primary/20 hover:bg-primary/10"
        >
          <BarChart className="h-4 w-4" />
          Riepilogo Ore Settimanali
          {expandedWeek ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      )}
          
      {currentUserEmployee && (
        <Toggle 
          pressed={showOnlyUserShifts} 
          onPressedChange={onToggleUserShifts}
          className="gap-1 bg-primary/5 border border-primary/20 hover:bg-primary/10 data-[state=on]:bg-primary/20"
        >
          <User className="h-4 w-4" />
          {showOnlyUserShifts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          I miei turni
        </Toggle>
      )}
    </div>
  );
}
