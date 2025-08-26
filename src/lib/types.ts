export type Role = "admin" | "employee";

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  firstName: string;
  lastName: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  username: string; // Keep as required since we'll auto-generate it if empty
  phone?: string;
  position?: string;
  color?: string;
  userId?: string; // Link to registered user
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
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // in hours
  daysOfWeek?: number[]; // 0 for Monday, 1 for Tuesday, ... 6 for Sunday
  createdAt: string;
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

export interface RestaurantSection {
  id: string;
  name: string;
  createdAt: string;
}

export interface RestaurantTable {
  id: string;
  sectionId: string;
  tableNumber: number;
  seats: number;
  createdAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  tableId: string;
  employeeId: string;
  status: 'active' | 'completed' | 'cancelled';
  stillWater: number;
  sparklingWater: number;
  bread: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  notes?: string;
  createdAt: string;
  isLastFirstCourse?: boolean; // Added this property for course separation
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { menuItem: MenuItem })[];
  table: RestaurantTable;
}

// Add the missing type
export interface OrderItemWithMenuData extends OrderItem {
  menuItem: MenuItem;
}

// New interface for print document data
export interface PrintData {
  order: OrderWithItems;
  table: RestaurantTable;
  timestamp: string;
}
