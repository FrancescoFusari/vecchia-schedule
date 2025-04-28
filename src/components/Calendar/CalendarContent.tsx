
import { WeeklyCalendar } from "./WeeklyCalendar";
import { MonthlyCalendar } from "./MonthlyCalendar";
import { VerticalCalendar } from "./VerticalCalendar";
import { Employee, Shift, ShiftTemplate } from "@/lib/types";

interface CalendarContentProps {
  isWeekView: boolean;
  isVerticalView: boolean;
  onViewChange: (weekView: boolean) => void;
  currentDate: Date;
  employees: Employee[];
  templates: ShiftTemplate[];
  onDateChange: (date: Date) => void;
  shifts: Shift[];
  isLoading: boolean;
  onAddShift: (date: Date, dayOfWeek: number) => void;
  onEditShift: (shift: Shift) => void;
}

export const CalendarContent = ({
  isWeekView,
  isVerticalView,
  onViewChange,
  currentDate,
  employees,
  templates,
  onDateChange,
  shifts,
  isLoading,
  onAddShift,
  onEditShift
}: CalendarContentProps) => {
  if (isVerticalView) {
    return (
      <VerticalCalendar
        employees={employees}
        templates={templates}
        currentDate={currentDate}
        onDateChange={onDateChange}
        shifts={shifts}
        isLoading={isLoading}
        onAddShift={onAddShift}
        onEditShift={onEditShift}
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
