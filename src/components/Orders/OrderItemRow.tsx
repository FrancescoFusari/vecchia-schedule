import { OrderItem, MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash, Minus, Plus } from "lucide-react";
import { useState } from "react";
interface OrderItemRowProps {
  item: OrderItem & {
    menuItem: MenuItem;
  };
  onUpdateQuantity: (id: string, quantity: number) => void;
  onDeleteItem: (id: string) => void;
}
export function OrderItemRow({
  item,
  onUpdateQuantity,
  onDeleteItem
}: OrderItemRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const handleIncrement = async () => {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      await onUpdateQuantity(item.id, item.quantity + 1);
    } finally {
      setIsUpdating(false);
    }
  };
  const handleDecrement = async () => {
    if (isUpdating || item.quantity <= 1) return;
    try {
      setIsUpdating(true);
      await onUpdateQuantity(item.id, item.quantity - 1);
    } finally {
      setIsUpdating(false);
    }
  };
  const handleDelete = async () => {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      await onDeleteItem(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  // Format price to show €X.XX
  const itemTotal = item.menuItem.price * item.quantity;
  const formattedPrice = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(itemTotal);
  return <div className="flex justify-between items-center py-3 border-b">
      <div className="flex-1">
        <div className="flex justify-between">
          <p className="font-medium">{item.menuItem.name}</p>
          
        </div>
        {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
      </div>
      <div className="flex items-center space-x-2 ml-4">
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleDecrement} disabled={isUpdating || item.quantity <= 1}>
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center font-medium">{item.quantity}</span>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={handleIncrement} disabled={isUpdating}>
          <Plus className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete} disabled={isUpdating}>
          <Trash className="h-3 w-3" />
        </Button>
      </div>
    </div>;
}