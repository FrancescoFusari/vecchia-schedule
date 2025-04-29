
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface TimeTrackingEntry {
  id: string;
  employeeId: string;
  date: string; // ISO format YYYY-MM-DD
  checkIn: string | null; // ISO timestamp
  checkOut: string | null; // ISO timestamp
  totalHours: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const timeTrackingService = {
  /**
   * Get a time tracking entry for a specific employee and date
   */
  getTimeTrackingEntry: async (employeeId: string, date: string): Promise<TimeTrackingEntry | null> => {
    try {
      const { data, error } = await supabase
        .from('time_tracking')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', date)
        .maybeSingle();

      if (error) {
        console.error("Error fetching time tracking entry:", error);
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        employeeId: data.employee_id,
        date: data.date,
        checkIn: data.check_in,
        checkOut: data.check_out,
        totalHours: data.total_hours,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error("Error in getTimeTrackingEntry:", error);
      throw error;
    }
  },

  /**
   * Record a check-in for an employee with the current time
   */
  checkIn: async (employeeId: string, notes?: string): Promise<TimeTrackingEntry> => {
    try {
      const now = new Date();
      return timeTrackingService.checkInWithTime(employeeId, now, notes);
    } catch (error) {
      console.error("Error in checkIn:", error);
      throw error;
    }
  },
  
  /**
   * Record a check-in for an employee with a specific time
   */
  checkInWithTime: async (employeeId: string, checkInTime: Date, notes?: string): Promise<TimeTrackingEntry> => {
    try {
      const checkInTimeISO = checkInTime.toISOString();
      const dateOnly = format(checkInTime, "yyyy-MM-dd");

      // Check if there's already an entry for this date
      const existingEntry = await timeTrackingService.getTimeTrackingEntry(employeeId, dateOnly);

      if (existingEntry) {
        // If there's already an entry but no check-in time, update it
        if (!existingEntry.checkIn) {
          const { data, error } = await supabase
            .from('time_tracking')
            .update({
              check_in: checkInTimeISO,
              notes: notes || existingEntry.notes
            })
            .eq('id', existingEntry.id)
            .select()
            .single();

          if (error) throw error;

          return {
            id: data.id,
            employeeId: data.employee_id,
            date: data.date,
            checkIn: data.check_in,
            checkOut: data.check_out,
            totalHours: data.total_hours,
            notes: data.notes,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        } else {
          // Already checked in
          return existingEntry;
        }
      } else {
        // Create a new entry
        const { data, error } = await supabase
          .from('time_tracking')
          .insert({
            employee_id: employeeId,
            date: dateOnly,
            check_in: checkInTimeISO,
            notes: notes || null
          })
          .select()
          .single();

        if (error) throw error;

        return {
          id: data.id,
          employeeId: data.employee_id,
          date: data.date,
          checkIn: data.check_in,
          checkOut: data.check_out,
          totalHours: data.total_hours,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    } catch (error) {
      console.error("Error in checkInWithTime:", error);
      throw error;
    }
  },

  /**
   * Record a check-out for an employee with the current time
   */
  checkOut: async (employeeId: string, notes?: string): Promise<TimeTrackingEntry> => {
    try {
      const now = new Date();
      return timeTrackingService.checkOutWithTime(employeeId, now, notes);
    } catch (error) {
      console.error("Error in checkOut:", error);
      throw error;
    }
  },
  
  /**
   * Record a check-out for an employee with a specific time
   */
  checkOutWithTime: async (employeeId: string, checkOutTime: Date, notes?: string): Promise<TimeTrackingEntry> => {
    try {
      const checkOutTimeISO = checkOutTime.toISOString();
      const dateOnly = format(checkOutTime, "yyyy-MM-dd");

      // Check if there's an entry for this date
      const existingEntry = await timeTrackingService.getTimeTrackingEntry(employeeId, dateOnly);

      if (!existingEntry) {
        // Create a new entry with only check-out time
        const { data, error } = await supabase
          .from('time_tracking')
          .insert({
            employee_id: employeeId,
            date: dateOnly,
            check_out: checkOutTimeISO,
            notes: notes || null
          })
          .select()
          .single();

        if (error) throw error;

        return {
          id: data.id,
          employeeId: data.employee_id,
          date: data.date,
          checkIn: data.check_in,
          checkOut: data.check_out,
          totalHours: data.total_hours,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      } else {
        // Calculate total hours if check-in exists
        let totalHours = null;
        if (existingEntry.checkIn) {
          const checkInDate = new Date(existingEntry.checkIn);
          const checkOutDate = new Date(checkOutTimeISO);
          const diffMs = checkOutDate.getTime() - checkInDate.getTime();
          totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)); // Convert ms to hours with 2 decimal places
        }

        // Update the existing entry
        const { data, error } = await supabase
          .from('time_tracking')
          .update({
            check_out: checkOutTimeISO,
            total_hours: totalHours,
            notes: notes || existingEntry.notes
          })
          .eq('id', existingEntry.id)
          .select()
          .single();

        if (error) throw error;

        return {
          id: data.id,
          employeeId: data.employee_id,
          date: data.date,
          checkIn: data.check_in,
          checkOut: data.check_out,
          totalHours: data.total_hours,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    } catch (error) {
      console.error("Error in checkOutWithTime:", error);
      throw error;
    }
  },

  /**
   * Get time tracking entries for a specific employee within a date range
   */
  getEmployeeTimeEntries: async (employeeId: string, startDate: string, endDate: string): Promise<TimeTrackingEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('time_tracking')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error("Error fetching time tracking entries:", error);
        throw error;
      }

      return data.map(entry => ({
        id: entry.id,
        employeeId: entry.employee_id,
        date: entry.date,
        checkIn: entry.check_in,
        checkOut: entry.check_out,
        totalHours: entry.total_hours,
        notes: entry.notes,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at
      }));
    } catch (error) {
      console.error("Error in getEmployeeTimeEntries:", error);
      throw error;
    }
  }
};
