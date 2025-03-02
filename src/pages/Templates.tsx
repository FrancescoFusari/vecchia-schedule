
import { useState, useEffect } from "react";
import { templateService } from "@/lib/supabase";
import { ShiftTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash } from "lucide-react";
import { TemplateModal } from "@/components/Shifts/TemplateModal";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Templates() {
  const { isAdmin } = useAuth();
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch templates when component mounts
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const templatesData = await templateService.getTemplates();
        console.log("Templates fetched:", templatesData);
        setTemplates(templatesData);
      } catch (error) {
        console.error("Error fetching shift templates:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante il caricamento dei template.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    setIsAddingTemplate(true);
  };
  
  const handleEditTemplate = (template: ShiftTemplate) => {
    setSelectedTemplate(template);
    setIsAddingTemplate(false);
  };
  
  const handleTemplateModalClose = () => {
    setSelectedTemplate(null);
    setIsAddingTemplate(false);
  };
  
  const handleSaveTemplate = async (template: ShiftTemplate) => {
    try {
      if (selectedTemplate) {
        // Update existing template
        await templateService.updateTemplate(template);
        toast({
          title: "Template aggiornato",
          description: "Il template è stato aggiornato con successo.",
        });
        
        // Update local state
        setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
      } else {
        // Add new template
        const newTemplate = await templateService.createTemplate(template);
        toast({
          title: "Template aggiunto",
          description: "Il nuovo template è stato aggiunto con successo.",
        });
        
        // Update local state
        setTemplates(prev => [...prev, newTemplate]);
      }
      
      handleTemplateModalClose();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del template.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await templateService.deleteTemplate(templateId);
      toast({
        title: "Template eliminato",
        description: "Il template è stato eliminato con successo.",
      });
      
      // Update local state
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      handleTemplateModalClose();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del template.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Template Turni</h1>
        {isAdmin() && (
          <Button onClick={handleAddTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Template
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Nessun template trovato.</p>
          {isAdmin() && (
            <Button className="mt-4" onClick={handleAddTemplate}>
              Crea il primo template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>
                  {template.startTime} - {template.endTime} ({template.duration} ore)
                </CardDescription>
              </CardHeader>
              {isAdmin() && (
                <CardFooter className="justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Modifica
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash className="h-4 w-4 mr-1" />
                        Elimina
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Questa azione eliminerà definitivamente il template "{template.name}" e non può essere annullata.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>
                          Elimina
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Template Modal */}
      {(isAddingTemplate || selectedTemplate) && (
        <TemplateModal
          isOpen={true}
          onClose={handleTemplateModalClose}
          template={selectedTemplate}
          onSave={handleSaveTemplate}
          onDelete={handleDeleteTemplate}
        />
      )}
    </div>
  );
}
