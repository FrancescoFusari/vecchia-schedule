
import { useState, useEffect } from "react";
import { Employee, ShiftTemplate } from "@/lib/types";
import { employeeService, templateService } from "@/lib/supabase";

export const useCalendarState = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeeData = await employeeService.getEmployees();
        setEmployees(employeeData);

        const templateData = await templateService.getTemplates();
        setTemplates(templateData);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
      }
    };
    
    fetchData();
  }, []);

  return {
    employees,
    templates,
    isLoading
  };
};
