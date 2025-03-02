
import { useState, useEffect } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarDay } from "./CalendarDay";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { getCalendarDays } from "@/lib/utils";
import { Shift, Employee } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { mockData } from "@/lib/supabase";
import { ShiftModal } from "../Shifts/ShiftModal";
import { HoursSummary } from "../Reports/HoursSummary";

export function MonthlyCalendar() {
  const { isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Load data
  useEffect(() => {
    // In a real app, this would fetch from Supabase
    setShifts(mockData.shifts);
    setEmployees(mockData.employees);
  }, []);
  
  // Update calendar when month changes or when shifts change
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getCalendarDays(year, month, shifts);
    setCalendarDays(days);
  }, [currentDate, shifts]);
  
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() - 1);
      return date;
    });
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() + 1);
      return date;
    });
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleAddShift = (date: Date) => {
    setSelectedDate(date);
    setIsAddingShift(true);
    setSelectedShift(null);
  };
  
  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setIsAddingShift(false);
  };
  
  const handleShiftModalClose = () => {
    setSelectedShift(null);
    setIsAddingShift(false);
  };
  
  const handleSaveShift = (shift: Shift) => {
    if (selectedShift) {
      // Update existing shift
      setShifts(prev => prev.map(s => s.id === shift.id ? shift : s));
    } else {
      // Add new shift
      setShifts(prev => [...prev, shift]);
    }
    
    handleShiftModalClose();
  };
  
  const handleDeleteShift = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
    handleShiftModalClose();
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Calendar header with navigation */}
      <CalendarHeader
        date={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
      
      {/* Calendar grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="py-2 text-center font-semibold text-sm border-r last:border-r-0 border-gray-200">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <CalendarDay
              key={index}
              day={day}
              employees={employees}
              onAddShift={isAdmin() ? handleAddShift : undefined}
              onEditShift={isAdmin() ? handleEditShift : undefined}
            />
          ))}
        </div>
      </div>
      
      {/* Hours summary */}
      <HoursSummary
        shifts={shifts}
        employees={employees}
        currentDate={currentDate}
      />
      
      {/* Shift modal for adding/editing shifts */}
      {(isAddingShift || selectedShift) && (
        <ShiftModal
          isOpen={true}
          onClose={handleShiftModalClose}
          shift={selectedShift}
          date={selectedDate}
          employees={employees}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
        />
      )}
    </div>
  );
}
