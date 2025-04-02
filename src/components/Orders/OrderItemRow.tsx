
import { useState } from "react";
import { OrderItemWithMenuData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Trash2, Edit, Check, X, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface OrderItemRowProps {
  item: OrderItemWithMenuData;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onUpdateNotes?: (itemId: string, notes: string) => Promise<void>;
}

export function OrderItemRow({
  item,
  onUpdateQuantity,
  onDeleteItem,
  onUpdateNotes
}: OrderItemRowProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");

  const handleUpdateQuantity = async () => {
    await onUpdateQuantity(item.id, quantity);
    setIsEditing(false);
  };

  const handleDeleteItem = async () => {
    await onDeleteItem(item.id);
    setIsDeleting(false);
  };

  const handleUpdateNotes = async () => {
    if (onUpdateNotes) {
      await onUpdateNotes(item.id, notes);
    }
    setIsNotesDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between py-2 px-1">
        <div className="flex-1">
          <div className="flex items-center">
            {isEditing ? (
              <div className="flex items-center space-x-2 pr-2">
                <Input
                  type="number"
                  min="1"
                  className="w-16 h-8"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            ) : (
              <span className="font-medium w-8 text-center">{item.quantity}x</span>
            )}
            <div className="pl-2 flex-1">
              <div className="flex items-center">
                <span className="flex-1 font-medium">{item.menuItem.name}</span>
              </div>
              {item.notes && (
                <p className="text-xs text-muted-foreground mt-1 pr-2">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={handleUpdateQuantity}
              >
                <Check className="h-4 w-4 text-primary" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => {
                  setIsEditing(false);
                  setQuantity(item.quantity);
                }}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setIsNotesDialogOpen(true)}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setIsDeleting(true)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      {isDeleting && (
        <div className="flex items-center justify-end gap-2 pb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsDeleting(false)}
          >
            Annulla
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteItem}
          >
            Elimina
          </Button>
        </div>
      )}

      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Note per {item.menuItem.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Aggiungi note per questo prodotto..."
              className="resize-none"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsNotesDialogOpen(false)}
              >
                Annulla
              </Button>
              <Button onClick={handleUpdateNotes}>
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
