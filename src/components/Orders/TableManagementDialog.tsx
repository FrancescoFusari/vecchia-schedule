
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTable, updateTable, deleteTable, getTables } from "@/lib/restaurant-service";
import { RestaurantTable } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Plus } from "lucide-react";
import { supabaseCustom as supabase } from "@/integrations/supabase/client";

interface TableManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
}

export function TableManagementDialog({ isOpen, onClose, sectionId }: TableManagementDialogProps) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [seats, setSeats] = useState<number>(4);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | null>(null);

  // Fetch tables when the dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
    
    // Set up real-time listener for table changes
    const tablesChannel = supabase
      .channel('tables_dialog_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'restaurant_tables',
        filter: `section_id=eq.${sectionId}`
      }, () => {
        // Refresh the tables whenever there's a change
        if (isOpen) {
          fetchTables();
        }
      })
      .subscribe();

    // Clean up the channel subscription when the component unmounts
    return () => {
      supabase.removeChannel(tablesChannel);
    };
  }, [isOpen, sectionId]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const tablesData = await getTables(sectionId);
      setTables(tablesData);
      
      // Find the highest table number to suggest next number
      if (tablesData.length > 0) {
        const maxTableNumber = Math.max(...tablesData.map(t => t.tableNumber));
        setTableNumber(maxTableNumber + 1);
      } else {
        setTableNumber(1);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i tavoli per questa sezione",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    try {
      if (editingTable) {
        // Update existing table
        await updateTable(editingTable.id, tableNumber, seats);
        toast({
          title: "Tavolo aggiornato",
          description: `Tavolo ${tableNumber} aggiornato con successo`
        });
      } else {
        // Add new table
        await createTable(sectionId, tableNumber, seats);
        toast({
          title: "Tavolo aggiunto",
          description: `Tavolo ${tableNumber} aggiunto con successo`
        });
      }
      
      // Reset form and refresh tables
      resetForm();
      fetchTables();
    } catch (error) {
      console.error("Error saving table:", error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il tavolo",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;
    
    try {
      await deleteTable(tableToDelete.id);
      toast({
        title: "Tavolo eliminato",
        description: `Tavolo ${tableToDelete.tableNumber} eliminato con successo`
      });
      setDeleteDialogOpen(false);
      fetchTables();
    } catch (error) {
      console.error("Error deleting table:", error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il tavolo",
        variant: "destructive"
      });
    }
  };

  const editTable = (table: RestaurantTable) => {
    setEditingTable(table);
    setTableNumber(table.tableNumber);
    setSeats(table.seats);
  };

  const confirmDeleteTable = (table: RestaurantTable) => {
    setTableToDelete(table);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTable(null);
    // Suggest the next table number
    const maxTableNumber = tables.length > 0 
      ? Math.max(...tables.map(t => t.tableNumber))
      : 0;
    setTableNumber(maxTableNumber + 1);
    setSeats(4);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Gestione Tavoli</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Numero Tavolo</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  min="1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats">Numero Posti</Label>
                <Input
                  id="seats"
                  type="number"
                  min="1"
                  value={seats}
                  onChange={(e) => setSeats(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              {editingTable && (
                <Button variant="outline" onClick={resetForm}>
                  Annulla
                </Button>
              )}
              <Button onClick={handleAddTable}>
                {editingTable ? 'Aggiorna Tavolo' : 'Aggiungi Tavolo'}
              </Button>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Tavoli esistenti</h3>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : tables.length === 0 ? (
                <p className="text-muted-foreground text-center py-2">Nessun tavolo disponibile</p>
              ) : (
                <div className="space-y-2">
                  {tables.map((table) => (
                    <div key={table.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div>
                        <span className="font-medium">Tavolo {table.tableNumber}</span>
                        <span className="text-muted-foreground ml-2">({table.seats} posti)</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => editTable(table)}>
                          Modifica
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive" 
                          onClick={() => confirmDeleteTable(table)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare il Tavolo {tableToDelete?.tableNumber}.
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-destructive text-destructive-foreground">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
