
export type Role = "admin" | "employee";

export interface User {
  id: string;
  username: string;
  role: Role;
  firstName: string;
  lastName: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  date: string; // ISO format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // in hours
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // in hours
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  shifts: Shift[];
}

export interface WeekSummary {
  employeeId: string;
  firstName: string;
  lastName: string;
  totalHours: number;
  weekStart: Date;
  weekEnd: Date;
}

export interface MonthSummary {
  employeeId: string;
  firstName: string;
  lastName: string;
  totalHours: number;
  month: number;
  year: number;
}
