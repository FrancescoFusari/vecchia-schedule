
import { useState, useEffect } from "react";
import { getSections, createSection, updateSection, deleteSection } from "@/lib/restaurant-service";
import { RestaurantSection } from "@/lib/types";
import { SectionCard } from "@/components/Orders/SectionCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Orders = () => {
  const [sections, setSections] = useState<RestaurantSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [editingSection, setEditingSection] = useState<RestaurantSection | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<RestaurantSection | null>(null);
  
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (isAdmin()) {
      // Optionally redirect admins to dashboard or another page
      // navigate('/dashboard');
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setIsLoading(true);
        const sectionsData = await getSections();
        setSections(sectionsData);
      } catch (error) {
        console.error("Error fetching sections:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare le sezioni del ristorante",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (user) {
      fetchSections();
    }
  }, [user]);

  const openAddSectionDialog = () => {
    setEditingSection(null);
    setSectionName("");
    setSectionDialogOpen(true);
  };

  const openEditSectionDialog = (section: RestaurantSection) => {
    setEditingSection(section);
    setSectionName(section.name);
    setSectionDialogOpen(true);
  };

  const openDeleteDialog = (section: RestaurantSection) => {
    setSectionToDelete(section);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveSection = async () => {
    if (!sectionName.trim()) {
      toast({
        title: "Errore",
        description: "Il nome della sezione non può essere vuoto",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingSection) {
        // Update existing section
        await updateSection(editingSection.id, sectionName);
        toast({
          title: "Sezione aggiornata",
          description: `Sezione "${sectionName}" aggiornata con successo`
        });
      } else {
        // Create new section
        await createSection(sectionName);
        toast({
          title: "Sezione aggiunta",
          description: `Sezione "${sectionName}" aggiunta con successo`
        });
      }
      
      // Refresh sections and close dialog
      const sectionsData = await getSections();
      setSections(sectionsData);
      setSectionDialogOpen(false);
    } catch (error) {
      console.error("Error saving section:", error);
      toast({
        title: "Errore",
        description: "Impossibile salvare la sezione",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    
    try {
      await deleteSection(sectionToDelete.id);
      toast({
        title: "Sezione eliminata",
        description: `Sezione "${sectionToDelete.name}" eliminata con successo`
      });
      
      // Refresh sections and close dialog
      const sectionsData = await getSections();
      setSections(sectionsData);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting section:", error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la sezione",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestione Comande</h1>
        
        <div className="flex space-x-2">
          {isAdmin() && (
            <Button 
              variant="outline" 
              onClick={openAddSectionDialog}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Aggiungi Sezione
            </Button>
          )}
          
          {isAdmin() && (
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Amministrazione
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nessuna sezione del ristorante configurata
          </p>
          {isAdmin() && (
            <Button onClick={openAddSectionDialog}>
              Aggiungi Sezione
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map(section => (
            <div key={section.id} className="relative group">
              {isAdmin() && (
                <div className="absolute right-2 top-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                    onClick={() => openEditSectionDialog(section)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Modifica</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive bg-background/80 backdrop-blur-sm"
                    onClick={() => openDeleteDialog(section)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Elimina</span>
                  </Button>
                </div>
              )}
              <SectionCard key={section.id} section={section} />
            </div>
          ))}
        </div>
      )}

      {/* Section Dialog */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Modifica Sezione' : 'Aggiungi Sezione'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sectionName">Nome Sezione</Label>
              <Input
                id="sectionName"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="Es: Sala Principale, Terrazza, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveSection}>
              {editingSection ? 'Aggiorna' : 'Aggiungi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare la sezione "{sectionToDelete?.name}".
              Questa azione eliminerà anche tutti i tavoli associati e non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSection} 
              className="bg-destructive text-destructive-foreground"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orders;
