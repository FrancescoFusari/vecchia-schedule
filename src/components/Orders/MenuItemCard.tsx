
import { MenuItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  const handleClick = () => {
    onAddToOrder(item);
  };

  // Format price to show €X.XX
  const formattedPrice = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(item.price);

  return (
    <Card className="h-full">
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-medium">{item.name}</h4>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {item.description}
              </p>
            )}
            <p className="text-sm font-semibold mt-1">{formattedPrice}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-primary"
            onClick={handleClick}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
