
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, ChevronDown, ChevronUp, Utensils } from "lucide-react";
import { MenuCategory, MenuItem, OrderItemWithMenuData } from "@/lib/types";
import { getMenuCategories, getMenuItems, updateOrderItem } from "@/lib/restaurant-service";
import { MenuItemCard } from "./MenuItemCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAddItem: (menuItemId: string, quantity: number, notes?: string) => Promise<void>;
  currentOrderItems?: OrderItemWithMenuData[];
}

export function AddItemModal({
  open,
  onClose,
  onAddItem,
  currentOrderItems = []
}: AddItemModalProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const itemsData = await getMenuItems();
        setMenuItems(itemsData);
        const categoriesData = await getMenuCategories();
        const categoriesWithItems = categoriesData.filter(category => itemsData.some(item => item.categoryId === category.id));
        setCategories(categoriesWithItems);
        // Categories are now collapsed by default (we don't set openCategories here)
      } catch (error) {
        console.error("Error fetching menu data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setOpenCategories([]); // Reset open categories when modal closes
    }
  }, [open]);

  const filteredItems = searchQuery 
    ? menuItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ) 
    : menuItems;

  const handleAddToOrder = async (item: MenuItem, quantity: number) => {
    try {
      await onAddItem(item.id, quantity);
      // We don't close the modal anymore to allow adding multiple items
      toast({
        title: "Prodotto aggiunto",
        description: `${quantity}x ${item.name} aggiunto all'ordine`
      });
    } catch (error) {
      console.error("Error adding item to order:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il prodotto all'ordine",
        variant: "destructive"
      });
    }
  };

  const addCourseDelimiter = async () => {
    if (!currentOrderItems || currentOrderItems.length === 0) {
      toast({
        title: "Impossibile aggiungere separatore",
        description: "Non ci sono prodotti nell'ordine",
        variant: "destructive"
      });
      return;
    }

    try {
      // Remove any existing separators first
      for (const item of currentOrderItems) {
        if (item.isLastFirstCourse) {
          await updateOrderItem(item.id, item.quantity, item.notes, false);
        }
      }
      
      // Set the last item as the delimiter
      const lastItem = currentOrderItems[currentOrderItems.length - 1];
      await updateOrderItem(lastItem.id, lastItem.quantity, lastItem.notes, true);
      
      toast({
        title: "Separatore aggiunto",
        description: "Separatore di portata aggiunto all'ordine"
      });
    } catch (error) {
      console.error("Error adding course delimiter:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il separatore di portata",
        variant: "destructive"
      });
    }
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const totalItems = currentOrderItems.reduce((sum, item) => sum + item.quantity, 0);
  const orderTotal = currentOrderItems.reduce((sum, item) => sum + (item.quantity * item.menuItem.price), 0);
  const formattedTotal = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(orderTotal);

  const renderProductsList = () => {
    if (searchQuery) {
      return (
        <div className="space-y-4">
          <h3 className="font-medium">Risultati ricerca</h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Nessun prodotto trovato
            </p>
          ) : (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="grid grid-cols-1 gap-2">
                {filteredItems.map(item => (
                  <MenuItemCard key={item.id} item={item} onAddToOrder={handleAddToOrder} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      );
    }
    
    return (
      <>
        <ScrollArea className="pr-4 h-[60vh]">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              categories.map(category => {
                const categoryItems = menuItems.filter(item => item.categoryId === category.id);
                if (categoryItems.length === 0) return null;
                
                const isOpen = openCategories.includes(category.id);
                
                return (
                  <Collapsible key={category.id} open={isOpen} onOpenChange={() => toggleCategory(category.id)}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between py-2 px-3 bg-muted/50 rounded-md hover:bg-muted">
                      <span className="font-medium">{category.name}</span>
                      {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 space-y-2">
                      {categoryItems.map(item => (
                        <MenuItemCard key={item.id} item={item} onAddToOrder={handleAddToOrder} />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            )}
          </div>
        </ScrollArea>
        
        {currentOrderItems.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">Riepilogo ordine</h3>
            <div className="bg-muted/30 rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Prodotti: {totalItems}</span>
                <span className="font-medium">{formattedTotal}</span>
              </div>
              <ScrollArea className="max-h-[120px]">
                <div className="space-y-1">
                  {currentOrderItems.map((item) => (
                    <div key={item.id} className="text-sm flex justify-between">
                      <span>{item.quantity}x {item.menuItem.name}</span>
                      <span>
                        {new Intl.NumberFormat('it-IT', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(item.menuItem.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </>
    );
  };

  const modalContent = (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca prodotto..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>
      
      <div className="mb-4">
        <Button 
          onClick={addCourseDelimiter} 
          variant="outline" 
          className="w-full flex items-center justify-center"
        >
          <Utensils className="h-4 w-4 mr-2" />
          Secondo
        </Button>
      </div>

      {renderProductsList()}
    </>
  );

  return isMobile ? (
    <Sheet open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent className="p-0 pt-6 h-[100dvh] max-h-[100dvh] inset-0 w-full" side="bottom">
        <SheetHeader className="px-4 pb-2">
          <SheetTitle>Aggiungi prodotto</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8 overflow-auto flex-1 h-[calc(100%-60px)]">
          {modalContent}
        </div>
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiungi prodotto</DialogTitle>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
