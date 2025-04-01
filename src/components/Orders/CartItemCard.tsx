
import { useState } from "react";
import { CartItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (item: CartItem, quantity: number) => void;
  onUpdateNotes: (item: CartItem, notes: string) => void;
  onRemove: (item: CartItem) => void;
}

export function CartItemCard({ 
  item, 
  onUpdateQuantity, 
  onUpdateNotes,
  onRemove
}: CartItemCardProps) {
  const [notes, setNotes] = useState(item.notes || "");
  
  // Format price to show €X.XX
  const formattedPrice = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(item.menuItem.price);
  
  const formattedTotalPrice = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(item.menuItem.price * item.quantity);

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    onUpdateNotes(item, newNotes);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex justify-between">
              <h4 className="font-medium text-base">{item.menuItem.name}</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 rounded-full -mt-1 -mr-1 hover:bg-destructive/10"
                onClick={() => onRemove(item)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center mt-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 rounded-full"
                onClick={() => onUpdateQuantity(item, Math.max(1, item.quantity - 1))}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <span className="mx-2 font-semibold text-sm w-6 text-center">
                {item.quantity}
              </span>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 rounded-full"
                onClick={() => onUpdateQuantity(item, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">{formattedPrice} × {item.quantity}</p>
                <p className="text-sm font-semibold text-primary">{formattedTotalPrice}</p>
              </div>
            </div>
            
            <div className="mt-2">
              <Input
                placeholder="Note (opzionali)"
                value={notes}
                onChange={handleNotesChange}
                className="text-xs h-8"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
