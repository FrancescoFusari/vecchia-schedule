
export interface User {
  id: string;
  username: string;
  email: string | null;
  role: 'admin' | 'employee';
  firstName: string;
  lastName: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone?: string;
  position?: string;
  color?: string;
  userId?: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  daysOfWeek?: number[];
  createdAt: string;
}

export interface WeekTemplate {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeekTemplateShift {
  id: string;
  templateId: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readBy: string[];
}

// New interfaces to fix TypeScript errors

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
