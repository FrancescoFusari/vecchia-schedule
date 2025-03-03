
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { WeekTemplate } from "@/lib/types";
import { weekTemplateService } from "@/services/weekTemplateService";
import { formatDate } from "@/lib/utils";
import { WeekTemplateModal } from "./WeekTemplateModal";
import { ApplyTemplateModal } from "./ApplyTemplateModal";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function WeekTemplatesList() {
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<WeekTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await weekTemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il caricamento dei modelli settimanali.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setIsCreateModalOpen(true);
  };

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsApplyModalOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const success = await weekTemplateService.deleteTemplate(templateId);
      if (success) {
        toast({
          title: "Modello eliminato",
          description: "Il modello settimanale è stato eliminato con successo.",
        });
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handleTemplateCreated = () => {
    setIsCreateModalOpen(false);
    fetchTemplates();
  };

  const handleTemplateApplied = () => {
    setIsApplyModalOpen(false);
    setSelectedTemplateId(null);
    toast({
      title: "Modello applicato",
      description: "Il modello settimanale è stato applicato con successo.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Modelli Settimanali</h2>
        <Button onClick={handleCreateTemplate}>
          <Plus className="mr-2 h-4 w-4" /> Nuovo Modello
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-muted/30 rounded-lg p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nessun modello settimanale</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea il tuo primo modello settimanale per riutilizzare facilmente i turni di una settimana.
          </p>
          <Button onClick={handleCreateTemplate} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Crea Modello
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span className="truncate pr-2">{template.name}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Questa azione eliminerà definitivamente il modello settimanale e tutti i turni associati.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Elimina
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                )}
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Periodo:</span>
                    <span>
                      {new Date(template.startDate).toLocaleDateString()} -{" "}
                      {new Date(template.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creato il:</span>
                    <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  Applica Modello
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <WeekTemplateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleTemplateCreated}
        />
      )}

      {isApplyModalOpen && selectedTemplateId && (
        <ApplyTemplateModal
          isOpen={isApplyModalOpen}
          onClose={() => {
            setIsApplyModalOpen(false);
            setSelectedTemplateId(null);
          }}
          onApply={handleTemplateApplied}
          templateId={selectedTemplateId}
        />
      )}
    </div>
  );
}
