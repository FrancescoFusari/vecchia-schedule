import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { MenuCategory, MenuItem } from "@/lib/types";
import { getMenuCategories, getMenuItems } from "@/lib/restaurant-service";
import { MenuItemCard } from "./MenuItemCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAddItem: (menuItemId: string, quantity: number, notes?: string) => Promise<void>;
}
export function AddItemModal({
  open,
  onClose,
  onAddItem
}: AddItemModalProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        setOpenCategories(categoriesWithItems.map(category => category.id));
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
      setSelectedItem(null);
      setQuantity(1);
      setNotes("");
      setSearchQuery("");
    }
  }, [open]);
  const filteredItems = searchQuery ? menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) : menuItems;
  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
  };
  const handleAddToOrder = async () => {
    if (!selectedItem) return;
    try {
      setIsSubmitting(true);
      await onAddItem(selectedItem.id, quantity, notes || undefined);
      onClose();
    } catch (error) {
      console.error("Error adding item to order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleBackToList = () => {
    setSelectedItem(null);
  };
  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
  };
  const renderProductsList = () => {
    if (searchQuery) {
      return <div className="space-y-4">
          <h3 className="font-medium">Risultati ricerca</h3>
          {isLoading ? <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div> : filteredItems.length === 0 ? <p className="text-center py-4 text-muted-foreground">
              Nessun prodotto trovato
            </p> : <ScrollArea className="h-[70vh] pr-4">
              <div className="grid grid-cols-1 gap-2">
                {filteredItems.map(item => <MenuItemCard key={item.id} item={item} onAddToOrder={handleSelectItem} />)}
              </div>
            </ScrollArea>}
        </div>;
    }
    return <ScrollArea className="pr-4">
        <div className="space-y-4">
          {isLoading ? <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div> : categories.map(category => {
          const categoryItems = menuItems.filter(item => item.categoryId === category.id);
          if (categoryItems.length === 0) return null;
          const isOpen = openCategories.includes(category.id);
          return <Collapsible key={category.id} open={isOpen} onOpenChange={() => toggleCategory(category.id)}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between py-2 px-3 bg-muted/50 rounded-md hover:bg-muted">
                    <span className="font-medium">{category.name}</span>
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    {categoryItems.map(item => <MenuItemCard key={item.id} item={item} onAddToOrder={handleSelectItem} />)}
                  </CollapsibleContent>
                </Collapsible>;
        })}
        </div>
      </ScrollArea>;
  };
  const renderContent = () => <>
      {selectedItem ? <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={handleBackToList} className="mr-2 h-8 w-8" aria-label="Torna indietro">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
            </div>
            {selectedItem.description && <p className="text-sm text-muted-foreground">{selectedItem.description}</p>}
            <p className="font-medium">
              {new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
          }).format(selectedItem.price)}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="quantity">
              Quantità
            </label>
            <div className="flex items-center">
              <Button type="button" variant="outline" size="sm" onClick={() => quantity > 1 && setQuantity(quantity - 1)} aria-label="Diminuisci quantità" className="h-10 w-10">
                -
              </Button>
              <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 mx-2 text-center" min="1" />
              <Button type="button" variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)} aria-label="Aumenta quantità" className="h-10 w-10">
                +
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="notes">
              Note (opzionale)
            </label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Es. senza cipolla, ben cotto, ecc." className="resize-none" />
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={handleBackToList}>
              Indietro
            </Button>
            <Button onClick={handleAddToOrder} disabled={isSubmitting}>
              {isSubmitting ? "Aggiunta in corso..." : "Aggiungi all'ordine"}
            </Button>
          </div>
        </div> : <>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cerca prodotto..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>

          {renderProductsList()}
        </>}
    </>;
  return isMobile ? <Sheet open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent className="p-0 pt-6 h-[100dvh] max-h-[100dvh] inset-0 w-full" side="bottom">
        <SheetHeader className="px-4 pb-2">
          <SheetTitle>Aggiungi prodotto</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8 overflow-auto flex-1 h-[calc(100%-60px)]">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet> : <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiungi prodotto</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>;
}