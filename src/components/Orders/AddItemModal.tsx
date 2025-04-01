
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, ChevronDown, ChevronUp, ShoppingCart } from "lucide-react";
import { MenuCategory, MenuItem, CartItem } from "@/lib/types";
import { getMenuCategories, getMenuItems } from "@/lib/restaurant-service";
import { MenuItemCard } from "./MenuItemCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAddItems: (items: CartItem[], roundId?: string) => Promise<void>;
  rounds?: { id: string; roundNumber: number }[];
  createNewRound?: boolean;
}

export function AddItemModal({ 
  open, 
  onClose, 
  onAddItems, 
  rounds = [],
  createNewRound = false
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
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [selectionMode, setSelectionMode] = useState(rounds.length > 0 || createNewRound);
  const [activeTab, setActiveTab] = useState<string>("selection");
  const [selectedRoundId, setSelectedRoundId] = useState<string | undefined>(
    rounds.length > 0 ? rounds[0].id : undefined
  );
  const [newRoundNumber, setNewRoundNumber] = useState<number>(
    rounds.length > 0 ? Math.max(...rounds.map(r => r.roundNumber)) + 1 : 1
  );
  
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const itemsData = await getMenuItems();
        setMenuItems(itemsData);
        
        const categoriesData = await getMenuCategories();
        
        const categoriesWithItems = categoriesData.filter(category => 
          itemsData.some(item => item.categoryId === category.id)
        );
        
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
      setSelectedItems([]);
      setActiveTab("selection");
    }
  }, [open]);

  const filteredItems = searchQuery 
    ? menuItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : menuItems;

  const handleSelectItem = (item: MenuItem) => {
    if (selectionMode) {
      // If in selection mode, toggle selection
      const existingItemIndex = selectedItems.findIndex(
        cartItem => cartItem.menuItem.id === item.id
      );
      
      if (existingItemIndex >= 0) {
        // Remove item if already selected
        setSelectedItems(prev => prev.filter(cartItem => cartItem.menuItem.id !== item.id));
      } else {
        // Add item with quantity 1
        setSelectedItems(prev => [...prev, { menuItem: item, quantity: 1 }]);
      }
    } else {
      // In single item mode, go to item detail view
      setSelectedItem(item);
    }
  };

  const handleUpdateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setSelectedItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], quantity: newQuantity };
      return newItems;
    });
  };

  const handleUpdateCartItemNotes = (index: number, notes: string) => {
    setSelectedItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], notes };
      return newItems;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddToOrder = async () => {
    if (selectedItem) {
      // Single item mode
      try {
        setIsSubmitting(true);
        await onAddItems([{ 
          menuItem: selectedItem, 
          quantity, 
          notes: notes || undefined 
        }], selectedRoundId);
        onClose();
      } catch (error) {
        console.error("Error adding item to order:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else if (selectedItems.length > 0) {
      // Multiple items mode
      try {
        setIsSubmitting(true);
        await onAddItems(selectedItems, selectedRoundId);
        onClose();
      } catch (error) {
        console.error("Error adding items to order:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBackToList = () => {
    setSelectedItem(null);
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

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
                {filteredItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToOrder={handleSelectItem}
                    isSelected={selectedItems.some(cartItem => cartItem.menuItem.id === item.id)}
                    selectionMode={selectionMode}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      );
    }

    return (
      <ScrollArea className="h-[60vh] pr-4">
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
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    {categoryItems.map(item => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddToOrder={handleSelectItem}
                        isSelected={selectedItems.some(cartItem => cartItem.menuItem.id === item.id)}
                        selectionMode={selectionMode}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </ScrollArea>
    );
  };

  const renderCartContent = () => {
    return (
      <div className="space-y-4">
        <h3 className="font-medium">Il tuo carrello ({selectedItems.length} prodotti)</h3>
        
        {selectedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nessun prodotto nel carrello</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => setActiveTab("selection")}
            >
              Aggiungi prodotti
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[40vh] pr-4">
              <div className="space-y-3">
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex flex-col border rounded-md p-3">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{item.menuItem.name}</h4>
                        <p className="text-sm text-primary font-semibold">
                          {new Intl.NumberFormat('it-IT', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(item.menuItem.price * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateCartItemQuantity(index, item.quantity - 1)}
                          aria-label="Diminuisci quantità"
                          className="h-8 w-8 rounded-full p-0"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateCartItemQuantity(index, item.quantity + 1)}
                          aria-label="Aumenta quantità"
                          className="h-8 w-8 rounded-full p-0"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    
                    <Textarea
                      placeholder="Note (opzionale)"
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateCartItemNotes(index, e.target.value)}
                      className="mt-2 h-16 resize-none text-sm"
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="self-end mt-1 text-destructive hover:text-destructive/90 hover:bg-destructive/10 p-0 h-auto"
                      onClick={() => handleRemoveCartItem(index)}
                    >
                      Rimuovi
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {(rounds.length > 0 || createNewRound) && (
              <div className="bg-muted/30 p-3 rounded-md">
                <h4 className="font-medium mb-2">Seleziona portata</h4>
                <div className="flex flex-wrap gap-2">
                  {rounds.map(round => (
                    <Badge 
                      key={round.id}
                      variant={selectedRoundId === round.id ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedRoundId(round.id)}
                    >
                      Portata {round.roundNumber}
                    </Badge>
                  ))}
                  {createNewRound && (
                    <Badge 
                      variant={selectedRoundId === undefined ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedRoundId(undefined)}
                    >
                      Nuova portata {newRoundNumber}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2">
              <span className="font-medium">Totale:</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('it-IT', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(
                  selectedItems.reduce(
                    (total, item) => total + (item.menuItem.price * item.quantity), 
                    0
                  )
                )}
              </span>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleAddToOrder} 
                disabled={isSubmitting || selectedItems.length === 0}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Aggiunta in corso..." : "Aggiungi all'ordine"}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderContent = () => (
    <>
      {selectedItem ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBackToList} 
                className="mr-2 h-8 w-8"
                aria-label="Torna indietro"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
            </div>
            {selectedItem.description && (
              <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
            )}
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
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                aria-label="Diminuisci quantità"
                className="h-10 w-10"
              >
                -
              </Button>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 mx-2 text-center"
                min="1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Aumenta quantità"
                className="h-10 w-10"
              >
                +
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="notes">
              Note (opzionale)
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Es. senza cipolla, ben cotto, ecc."
              className="resize-none"
            />
          </div>

          {(rounds.length > 0 || createNewRound) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Portata</label>
              <div className="flex flex-wrap gap-2">
                {rounds.map(round => (
                  <Badge 
                    key={round.id}
                    variant={selectedRoundId === round.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedRoundId(round.id)}
                  >
                    Portata {round.roundNumber}
                  </Badge>
                ))}
                {createNewRound && (
                  <Badge 
                    variant={selectedRoundId === undefined ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedRoundId(undefined)}
                  >
                    Nuova portata {newRoundNumber}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={handleBackToList}>
              Indietro
            </Button>
            <Button 
              onClick={handleAddToOrder} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Aggiunta in corso..." : "Aggiungi all'ordine"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {selectionMode && (
            <Tabs className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="selection">
                  Prodotti
                </TabsTrigger>
                <TabsTrigger value="cart" className="relative">
                  Carrello
                  {selectedItems.length > 0 && (
                    <Badge className="ml-2">{selectedItems.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="selection" className="mt-0">
                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca prodotto..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {renderProductsList()}
              </TabsContent>
              
              <TabsContent value="cart" className="mt-0">
                {renderCartContent()}
              </TabsContent>
            </Tabs>
          )}
          
          {!selectionMode && (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca prodotto..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {renderProductsList()}
            </>
          )}
        </>
      )}
    </>
  );

  const modalTitle = selectionMode 
    ? activeTab === "selection" 
      ? "Seleziona prodotti" 
      : "Carrello prodotti"
    : "Aggiungi prodotto";

  return isMobile ? (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="p-0 pt-6 h-screen max-h-screen inset-0" side="bottom">
        <SheetHeader className="px-4 pb-2">
          <SheetTitle>{modalTitle}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8 overflow-auto flex-1">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
