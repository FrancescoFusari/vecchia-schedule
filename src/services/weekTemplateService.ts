
import { supabase, adminClient } from "@/lib/supabase";
import { Shift, WeekTemplate, WeekTemplateShift } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

export const weekTemplateService = {
  getTemplates: async (): Promise<WeekTemplate[]> => {
    try {
      console.log("Fetching week templates from database...");
      
      // Check for admin session first to determine which client to use
      const adminSession = localStorage.getItem('workshift_admin_session');
      const client = adminSession ? adminClient : supabase;
      
      const { data, error } = await client
        .from('week_templates')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching week templates:", error);
        throw error;
      }
      
      if (!data) {
        console.warn("No week templates data returned");
        return [];
      }
      
      // Map the data to match the WeekTemplate type
      const templates: WeekTemplate[] = data.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description || '',
        startDate: template.start_date,
        endDate: template.end_date,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }));
      
      console.log(`Successfully fetched ${templates.length} week templates`);
      return templates;
    } catch (error) {
      console.error("Error fetching week templates:", error);
      return [];
    }
  },
  
  getTemplateShifts: async (templateId: string): Promise<WeekTemplateShift[]> => {
    try {
      console.log(`Fetching shifts for template: ${templateId}`);
      
      // Check for admin session first to determine which client to use
      const adminSession = localStorage.getItem('workshift_admin_session');
      const client = adminSession ? adminClient : supabase;
      
      const { data, error } = await client
        .from('week_template_shifts')
        .select('*')
        .eq('template_id', templateId)
        .order('date', { ascending: true });
        
      if (error) {
        console.error("Error fetching template shifts:", error);
        throw error;
      }
      
      if (!data) {
        console.warn("No template shifts data returned");
        return [];
      }
      
      // Map the data to match the WeekTemplateShift type
      const shifts: WeekTemplateShift[] = data.map(shift => ({
        id: shift.id,
        templateId: shift.template_id,
        employeeId: shift.employee_id,
        date: shift.date,
        startTime: shift.start_time,
        endTime: shift.end_time,
        duration: shift.duration,
        notes: shift.notes || '',
        createdAt: shift.created_at,
        updatedAt: shift.updated_at
      }));
      
      console.log(`Successfully fetched ${shifts.length} template shifts`);
      return shifts;
    } catch (error) {
      console.error("Error fetching template shifts:", error);
      return [];
    }
  },
  
  createTemplate: async (template: Omit<WeekTemplate, 'id' | 'createdAt' | 'updatedAt'>, shifts: Omit<WeekTemplateShift, 'id' | 'templateId' | 'createdAt' | 'updatedAt'>[]): Promise<WeekTemplate | null> => {
    try {
      console.log("Creating new week template:", template);
      
      // Check for admin session
      const adminSession = localStorage.getItem('workshift_admin_session');
      
      if (!adminSession) {
        toast({
          title: "Errore",
          description: "Solo gli amministratori possono creare modelli settimanali.",
          variant: "destructive",
        });
        throw new Error("Admin privileges required to create week templates");
      }
      
      // Prepare the data object for insertion
      const templateData = {
        name: template.name,
        description: template.description || null,
        start_date: template.startDate,
        end_date: template.endDate
      };
      
      // Create the template first
      const { data: newTemplate, error: templateError } = await adminClient
        .from('week_templates')
        .insert(templateData)
        .select()
        .single();
        
      if (templateError) {
        console.error("Error creating week template:", templateError);
        throw templateError;
      }
      
      if (!newTemplate) {
        throw new Error("No data returned after creating week template");
      }
      
      // Now create all the shifts for this template
      if (shifts.length > 0) {
        const shiftData = shifts.map(shift => ({
          template_id: newTemplate.id,
          employee_id: shift.employeeId,
          date: shift.date,
          start_time: shift.startTime,
          end_time: shift.endTime,
          duration: shift.duration,
          notes: shift.notes || null
        }));
        
        const { error: shiftsError } = await adminClient
          .from('week_template_shifts')
          .insert(shiftData);
          
        if (shiftsError) {
          console.error("Error creating template shifts:", shiftsError);
          // Delete the template since we couldn't add shifts
          await adminClient.from('week_templates').delete().eq('id', newTemplate.id);
          throw shiftsError;
        }
      }
      
      const createdTemplate: WeekTemplate = {
        id: newTemplate.id,
        name: newTemplate.name,
        description: newTemplate.description || '',
        startDate: newTemplate.start_date,
        endDate: newTemplate.end_date,
        createdAt: newTemplate.created_at,
        updatedAt: newTemplate.updated_at
      };
      
      console.log("Week template created successfully with ID:", createdTemplate.id);
      return createdTemplate;
    } catch (error) {
      console.error("Error creating week template:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la creazione del modello settimanale.",
        variant: "destructive",
      });
      return null;
    }
  },
  
  applyTemplate: async (templateId: string, targetDate: string): Promise<boolean> => {
    try {
      console.log(`Applying template ${templateId} starting from ${targetDate}`);
      
      // Check for admin session
      const adminSession = localStorage.getItem('workshift_admin_session');
      
      if (!adminSession) {
        toast({
          title: "Errore",
          description: "Solo gli amministratori possono applicare modelli settimanali.",
          variant: "destructive",
        });
        throw new Error("Admin privileges required to apply week templates");
      }
      
      // Get template shifts
      const templateShifts = await weekTemplateService.getTemplateShifts(templateId);
      
      if (templateShifts.length === 0) {
        toast({
          title: "Attenzione",
          description: "Il modello selezionato non contiene turni.",
          variant: "destructive",
        });
        return false;
      }
      
      // Get the template to find start date
      const templates = await weekTemplateService.getTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error("Template not found");
      }
      
      // Calculate the offset between the template start date and the target date
      const templateStartDate = new Date(template.startDate);
      const targetDateObj = new Date(targetDate);
      
      // Calculate the difference in days between the template start date and the selected target date
      const daysDifference = Math.floor(
        (targetDateObj.getTime() - templateStartDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Create new shifts based on template shifts with adjusted dates
      const newShifts = templateShifts.map(shift => {
        const shiftDate = new Date(shift.date);
        shiftDate.setDate(shiftDate.getDate() + daysDifference);
        
        return {
          employeeId: shift.employeeId,
          date: formatDate(shiftDate),
          startTime: shift.startTime,
          endTime: shift.endTime,
          duration: shift.duration,
          notes: shift.notes
        };
      });
      
      // Use a for loop to create shifts one by one to better track any errors
      for (const shift of newShifts) {
        try {
          await adminClient
            .from('shifts')
            .insert({
              employee_id: shift.employeeId,
              date: shift.date,
              start_time: shift.startTime,
              end_time: shift.endTime,
              duration: shift.duration,
              notes: shift.notes || null
            });
        } catch (error) {
          console.error("Error creating shift from template:", error, shift);
          // Continue trying to create other shifts even if one fails
        }
      }
      
      console.log(`Successfully applied template with ${newShifts.length} shifts`);
      return true;
    } catch (error) {
      console.error("Error applying week template:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'applicazione del modello settimanale.",
        variant: "destructive",
      });
      return false;
    }
  },
  
  deleteTemplate: async (templateId: string): Promise<boolean> => {
    try {
      console.log("Deleting week template with ID:", templateId);
      
      // Check for admin session
      const adminSession = localStorage.getItem('workshift_admin_session');
      
      if (!adminSession) {
        toast({
          title: "Errore",
          description: "Solo gli amministratori possono eliminare modelli settimanali.",
          variant: "destructive",
        });
        throw new Error("Admin privileges required to delete week templates");
      }
      
      // Delete the template (cascade delete will handle the shifts)
      const { error } = await adminClient
        .from('week_templates')
        .delete()
        .eq('id', templateId);
        
      if (error) {
        console.error("Error deleting week template:", error);
        throw error;
      }
      
      console.log("Week template deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting week template:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del modello settimanale.",
        variant: "destructive",
      });
      return false;
    }
  }
};
