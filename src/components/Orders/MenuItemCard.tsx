
import { MenuItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem) => void;
  isSelected?: boolean;
  selectionMode?: boolean;
}

export function MenuItemCard({ 
  item, 
  onAddToOrder, 
  isSelected = false,
  selectionMode = false
}: MenuItemCardProps) {
  const handleClick = () => {
    onAddToOrder(item);
  };

  // Format price to show €X.XX
  const formattedPrice = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(item.price);

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-0">
        <button 
          onClick={handleClick}
          className="w-full text-left p-3 flex items-start justify-between"
        >
          <div className="flex-1 pr-2">
            <h4 className="font-medium text-base">{item.name}</h4>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {item.description}
              </p>
            )}
            <p className="text-sm font-semibold mt-1.5 text-primary">{formattedPrice}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 rounded-full flex-shrink-0 hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            aria-label={`${selectionMode ? (isSelected ? 'Rimuovi' : 'Aggiungi') : 'Aggiungi'} ${item.name}`}
          >
            {selectionMode && isSelected ? (
              <Check className="h-5 w-5 text-primary" />
            ) : (
              <Plus className="h-5 w-5 text-primary" />
            )}
          </Button>
        </button>
      </CardContent>
    </Card>
  );
}
