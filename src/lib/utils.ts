import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Shift, CalendarDay } from "./types";
import { DAYS_OF_WEEK } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date as YYYY-MM-DD in a timezone-safe way
export function formatDate(date: Date): string {
  // Use this method for timezone-safe date formatting without changing the date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Format time (HH:MM) - ensure no seconds are displayed
export function formatTime(time: string): string {
  // If time contains seconds (HH:MM:SS), remove them
  if (time.includes(':') && time.split(':').length > 2) {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  }
  return time;
}

// Calculate shift duration in hours
export function calculateShiftDuration(startTime: string, endTime: string): number {
  // Ensure we're only working with HH:MM format
  const cleanStartTime = formatTime(startTime);
  const cleanEndTime = formatTime(endTime);
  
  const [startHour, startMinute] = cleanStartTime.split(":").map(Number);
  const [endHour, endMinute] = cleanEndTime.split(":").map(Number);
  
  const start = startHour + startMinute / 60;
  const end = endHour + endMinute / 60;
  
  return Math.round((end - start) * 100) / 100;
}

// Generate calendar days for a month view
export function getCalendarDays(year: number, month: number, shifts: Shift[]): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Adjust for Monday as first day of week (0 is Monday in our system)
  let dayOfWeek = firstDayOfMonth.getDay();
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, and shift others back by 1
  
  const daysInMonth = lastDayOfMonth.getDate();
  const today = new Date();
  
  // Create array for all days to display
  const days: CalendarDay[] = [];
  
  // Add days from previous month to start the calendar from Monday
  if (dayOfWeek > 0) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        shifts: filterShiftsByDate(shifts, date),
      });
    }
  }
  
  // Add days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      shifts: filterShiftsByDate(shifts, date),
    });
  }
  
  // Add days from next month to complete the calendar grid
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  
  const remainingDays = 42 - days.length; // 6 rows of 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(nextYear, nextMonth, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      shifts: filterShiftsByDate(shifts, date),
    });
  }
  
  return days;
}

// Helper to filter shifts by date
function filterShiftsByDate(shifts: Shift[], date: Date): Shift[] {
  const dateStr = formatDate(date);
  return shifts.filter(shift => shift.date === dateStr);
}

// Check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Get week start and end dates
export function getWeekDates(date: Date): { start: Date; end: Date } {
  const day = date.getDay();
  // Adjust for Monday as first day of week (0 is Monday in our system)
  const diff = day === 0 ? 6 : day - 1;
  
  const monday = new Date(date);
  monday.setDate(date.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

// Format month and year
export function formatMonthYear(date: Date): string {
  return `${date.toLocaleString('it', { month: 'long' })} ${date.getFullYear()}`;
}

// Format employee name
export function formatEmployeeName(firstName: string, lastName: string): string {
  if (!lastName) return firstName;
  return `${firstName} ${lastName.charAt(0)}`;
}

// Format shift display - modified to only show first name and the initial of the last name and ensure no seconds in times
export function formatShiftDisplay(firstName: string, lastName: string, startTime: string, endTime: string): string {
  const displayName = lastName ? `${firstName} ${lastName.charAt(0)}` : firstName;
  return `${displayName} ${formatTime(startTime)}-${formatTime(endTime)}`;
}

// Calculate total hours for an employee in a given period
export function calculateTotalHours(shifts: Shift[], employeeId: string): number {
  return shifts
    .filter(shift => shift.employeeId === employeeId)
    .reduce((total, shift) => total + shift.duration, 0);
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
