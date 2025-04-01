
import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetHeader, SheetContent, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { MenuItem, MenuCategory, CartItem } from "@/lib/types";
import { getMenuCategories, getMenuItems } from "@/lib/restaurant-service";
import { MenuItemCard } from "./MenuItemCard";
import { CartItemCard } from "./CartItemCard";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: CartItem[], roundNumber?: number) => void;
}

export function AddItemModal({ isOpen, onClose, onAddItems }: AddItemModalProps) {
  const isMobile = useIsMobile();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch menu categories
        const categoriesData = await getMenuCategories();
        setCategories(categoriesData);
        
        if (categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id);
        }
        
        // Fetch all menu items
        const itemsData = await getMenuItems();
        setItems(itemsData);
        setFilteredItems(itemsData);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching menu data:", error);
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Filter items when search query or active category changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredItems(filtered);
    } else if (activeCategory) {
      const filtered = items.filter(item => item.categoryId === activeCategory);
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchQuery, activeCategory, items]);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery("");
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query) {
      setActiveCategory(null);
    } else if (categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    // Check if item is already in cart
    const existingIndex = selectedItems.findIndex(
      cartItem => cartItem.menuItem.id === item.id
    );
    
    if (existingIndex >= 0) {
      // If in selection mode, remove the item
      setSelectedItems(prev => prev.filter(cartItem => cartItem.menuItem.id !== item.id));
    } else {
      // Add new item to cart
      setSelectedItems(prev => [...prev, { menuItem: item, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (item: CartItem, quantity: number) => {
    setSelectedItems(prev => 
      prev.map(cartItem => 
        cartItem.menuItem.id === item.menuItem.id 
          ? { ...cartItem, quantity } 
          : cartItem
      )
    );
  };

  const handleUpdateNotes = (item: CartItem, notes: string) => {
    setSelectedItems(prev => 
      prev.map(cartItem => 
        cartItem.menuItem.id === item.menuItem.id 
          ? { ...cartItem, notes } 
          : cartItem
      )
    );
  };

  const handleRemoveFromCart = (item: CartItem) => {
    setSelectedItems(prev => 
      prev.filter(cartItem => cartItem.menuItem.id !== item.menuItem.id)
    );
  };

  const calculateTotalItems = () => {
    return selectedItems.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateTotalPrice = () => {
    return selectedItems.reduce(
      (total, item) => total + (item.menuItem.price * item.quantity), 
      0
    );
  };

  const isItemSelected = (itemId: string) => {
    return selectedItems.some(item => item.menuItem.id === itemId);
  };

  const handleAddToOrder = () => {
    if (selectedItems.length > 0) {
      onAddItems(selectedItems, roundNumber);
      setSelectedItems([]);
      onClose();
    }
  };

  const totalItems = calculateTotalItems();
  const totalPrice = calculateTotalPrice();
  const formattedTotalPrice = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(totalPrice);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const ModalContent = (
    <>
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca prodotti..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs defaultValue={categories[0]?.id} value={activeCategory || undefined} className="flex-1 flex flex-col">
          <TabsList className="mb-2 overflow-auto justify-start h-auto">
            {categories.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className="whitespace-nowrap"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1 -mx-1 px-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun prodotto trovato
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredItems.map(item => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    onAddToOrder={handleAddToCart}
                    isSelected={isItemSelected(item.id)}
                    selectionMode={true}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </div>

      {selectedItems.length > 0 && (
        <div className={`${isCartOpen ? 'mt-4' : 'mt-4'}`}>
          <Button 
            variant="outline" 
            className="w-full flex justify-between items-center mb-3"
            onClick={toggleCart}
          >
            <div className="flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2" />
              <span>Carrello ({totalItems} {totalItems === 1 ? 'prodotto' : 'prodotti'})</span>
            </div>
            <Badge variant="secondary" className="ml-2">{formattedTotalPrice}</Badge>
            {isCartOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>

          {isCartOpen && (
            <>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedItems.map((item, index) => (
                  <CartItemCard 
                    key={item.menuItem.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onUpdateNotes={handleUpdateNotes}
                    onRemove={handleRemoveFromCart}
                  />
                ))}
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="mr-2">Giro:</span>
                    <select 
                      value={roundNumber}
                      onChange={(e) => setRoundNumber(parseInt(e.target.value))}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value={1}>Primo</option>
                      <option value={2}>Secondo</option>
                      <option value={3}>Terzo</option>
                    </select>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Totale</p>
                    <p className="text-lg font-bold text-primary">{formattedTotalPrice}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col p-4">
          <SheetHeader className="text-left pb-2">
            <SheetTitle>Aggiungi prodotti</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {ModalContent}
          </div>
          
          <SheetFooter className="mt-2">
            <div className="flex w-full space-x-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Annulla
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleAddToOrder}
                disabled={selectedItems.length === 0}
              >
                Aggiungi al tavolo
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]">
        <DialogTitle>Aggiungi prodotti</DialogTitle>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {ModalContent}
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button 
            onClick={handleAddToOrder}
            disabled={selectedItems.length === 0}
          >
            Aggiungi al tavolo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
