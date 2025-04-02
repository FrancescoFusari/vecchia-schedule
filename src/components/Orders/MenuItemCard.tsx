
import { useState } from "react";
import { MenuItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem, quantity: number) => void;
}

export function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToOrder = () => {
    onAddToOrder(item, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="w-full text-left p-3 flex items-start justify-between">
          <div className="flex-1 pr-2">
            <h4 className="font-medium text-base">{item.name}</h4>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {item.description}
              </p>
            )}
          </div>
          <div className="flex items-center">
            <div className="flex items-center mr-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full flex-shrink-0"
                onClick={handleDecrement}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="mx-2 text-sm font-medium w-4 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full flex-shrink-0"
                onClick={handleIncrement}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 rounded-full flex-shrink-0 hover:bg-primary/10"
              onClick={handleAddToOrder}
              aria-label={`Aggiungi ${item.name}`}
            >
              <Plus className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
