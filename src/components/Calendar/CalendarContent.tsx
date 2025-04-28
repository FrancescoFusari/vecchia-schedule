
import { WeeklyCalendar } from "./WeeklyCalendar";
import { MonthlyCalendar } from "./MonthlyCalendar";
import { VerticalCalendar } from "./VerticalCalendar";
import { Employee, ShiftTemplate } from "@/lib/types";

interface CalendarContentProps {
  isWeekView: boolean;
  isVerticalView: boolean;
  onViewChange: (weekView: boolean) => void;
  currentDate: Date;
  employees: Employee[];
  templates: ShiftTemplate[];
  onDateChange: (date: Date) => void;
}

export const CalendarContent = ({
  isWeekView,
  isVerticalView,
  onViewChange,
  currentDate,
  employees,
  templates,
  onDateChange
}: CalendarContentProps) => {
  if (isVerticalView) {
    return (
      <VerticalCalendar
        employees={employees}
        templates={templates}
        currentDate={currentDate}
        onDateChange={onDateChange}
      />
    );
  }

  return isWeekView ? (
    <WeeklyCalendar 
      onViewChange={onViewChange} 
      key="weekly" 
      data-component="weekly-calendar" 
    />
  ) : (
    <MonthlyCalendar 
      onViewChange={onViewChange} 
      key="monthly" 
      data-component="monthly-calendar" 
    />
  );
};
