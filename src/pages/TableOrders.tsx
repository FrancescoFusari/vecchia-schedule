import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { RestaurantTable, OrderWithItems } from "@/lib/types";
import { getTables, getActiveOrder, getCompletedOrders, createOrder, updateOrder, addOrderItem, updateOrderItem, deleteOrderItem } from "@/lib/restaurant-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, MoreVertical, Droplets, Droplet, Bread } from "lucide-react";
import { CounterControl } from "@/components/Orders/CounterControl";
import { OrderItemRow } from "@/components/Orders/OrderItemRow";
import { AddItemModal } from "@/components/Orders/AddItemModal";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CompletedOrdersList } from "@/components/Orders/CompletedOrdersList";

const TableOrders = () => {
  const { tableId } = useParams<{ tableId: string; }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [completedOrders, setCompletedOrders] = useState<OrderWithItems[]>([]);
  const [stillWater, setStillWater] = useState(0);
  const [sparklingWater, setSparklingWater] = useState(0);
  const [bread, setBread] = useState(0);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchTableData = async () => {
      if (!tableId || !user) return;
      try {
        setIsLoading(true);

        const tables = await getTables();
        const tableData = tables.find(t => t.id === tableId);
        if (!tableData) {
          toast({
            title: "Errore",
            description: "Tavolo non trovato",
            variant: "destructive"
          });
          navigate('/orders');
          return;
        }
        setTable(tableData);

        const activeOrder = await getActiveOrder(tableId);
        if (activeOrder) {
          setOrder(activeOrder);
          setStillWater(activeOrder.stillWater);
          setSparklingWater(activeOrder.sparklingWater);
          setBread(activeOrder.bread);
        }

        const completed = await getCompletedOrders(tableId);
        setCompletedOrders(completed);
      } catch (error) {
        console.error("Error fetching table data:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati del tavolo",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTableData();
  }, [tableId, navigate, user]);

  const handleStillWaterChange = async (value: number) => {
    setStillWater(value);
    if (!order || !user) return;
    try {
      setIsSaving(true);
      await updateOrder(order.id, value, undefined, undefined);
      toast({
        title: "Aggiornato",
        description: "Acqua naturale aggiornata"
      });
    } catch (error) {
      console.error("Error updating still water:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'acqua naturale",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSparklingWaterChange = async (value: number) => {
    setSparklingWater(value);
    if (!order || !user) return;
    try {
      setIsSaving(true);
      await updateOrder(order.id, undefined, value, undefined);
      toast({
        title: "Aggiornato",
        description: "Acqua frizzante aggiornata"
      });
    } catch (error) {
      console.error("Error updating sparkling water:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'acqua frizzante",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBreadChange = async (value: number) => {
    setBread(value);
    if (!order || !user) return;
    try {
      setIsSaving(true);
      await updateOrder(order.id, undefined, undefined, value);
      toast({
        title: "Aggiornato",
        description: "Pane aggiornato"
      });
    } catch (error) {
      console.error("Error updating bread:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il pane",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewOrder = async () => {
    if (!tableId || !user) return;
    try {
      setIsSaving(true);
      console.log("Creating order with user ID:", user.id);
      const newOrder = await createOrder(tableId, user.id, stillWater, sparklingWater, bread);

      const fullOrder = await getActiveOrder(tableId);
      setOrder(fullOrder);
      toast({
        title: "Creato",
        description: "Nuovo ordine creato"
      });
    } catch (error) {
      console.error("Error creating new order:", error);
      toast({
        title: "Errore",
        description: "Impossibile creare un nuovo ordine",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = async (menuItemId: string, quantity: number, notes?: string) => {
    if (!order || !user) return;
    try {
      setIsSaving(true);
      await addOrderItem(order.id, menuItemId, quantity, notes);

      const updatedOrder = await getActiveOrder(tableId!);
      setOrder(updatedOrder);
      toast({
        title: "Aggiunto",
        description: "Prodotto aggiunto all'ordine"
      });
    } catch (error) {
      console.error("Error adding item to order:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il prodotto all'ordine",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (!order || !user) return;
    try {
      await updateOrderItem(itemId, quantity);

      setOrder({
        ...order,
        items: order.items.map(item => item.id === itemId ? {
          ...item,
          quantity
        } : item)
      });
    } catch (error) {
      console.error("Error updating item quantity:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la quantità",
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!order || !user) return;
    try {
      await deleteOrderItem(itemId);

      setOrder({
        ...order,
        items: order.items.filter(item => item.id !== itemId)
      });
      toast({
        title: "Rimosso",
        description: "Prodotto rimosso dall'ordine"
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Errore",
        description: "Impossibile rimuovere il prodotto",
        variant: "destructive"
      });
    }
  };

  const handleCompleteOrder = async () => {
    if (!order || !user) return;
    try {
      setIsSaving(true);
      await updateOrder(order.id, undefined, undefined, undefined, 'completed');
      
      const updatedCompletedOrders = [...completedOrders, { ...order, status: 'completed' }];
      setCompletedOrders(updatedCompletedOrders);
      
      setOrder(null);
      setStillWater(0);
      setSparklingWater(0);
      setBread(0);
      
      toast({
        title: "Completato",
        description: "Ordine completato con successo"
      });
    } catch (error) {
      console.error("Error completing order:", error);
      toast({
        title: "Errore",
        description: "Impossibile completare l'ordine",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !user) return;
    try {
      setIsSaving(true);
      await updateOrder(order.id, undefined, undefined, undefined, 'cancelled');
      toast({
        title: "Annullato",
        description: "Ordine annullato"
      });

      navigate('/orders');
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Errore",
        description: "Impossibile annullare l'ordine",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotal = () => {
    if (!order) return 0;
    return order.items.reduce((total, item) => {
      return total + item.menuItem.price * item.quantity;
    }, 0);
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return <div className="container mx-auto max-w-4xl py-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }

  if (!table) {
    return <div className="container mx-auto max-w-4xl py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Tavolo non trovato</p>
          <Button onClick={() => navigate('/orders')}>
            Torna alla lista tavoli
          </Button>
        </div>
      </div>;
  }

  return <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            Tavolo {table.tableNumber}
          </h1>
        </div>
        
        {order && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCompleteOrder}>
                Completa ordine
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCancelOrder} className="text-destructive">
                Annulla ordine
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {order ? 'Ordine attivo' : 'Nessun ordine attivo'}
            </h2>
            
            {!order && <Button onClick={handleAddNewOrder} disabled={isSaving}>
                {isSaving ? "Creazione..." : "Nuovo ordine"}
              </Button>}
          </div>

          {!order ? <div className="space-y-4">
              <p className="text-muted-foreground">
                Non ci sono ordini attivi per questo tavolo. Clicca su "Nuovo ordine" per iniziare.
              </p>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <CounterControl 
                  label="Acqua Nat." 
                  value={stillWater} 
                  onChange={setStillWater} 
                />
                <CounterControl 
                  label="Acqua Gas." 
                  value={sparklingWater} 
                  onChange={setSparklingWater} 
                />
                <CounterControl 
                  label="Pane" 
                  value={bread} 
                  onChange={setBread} 
                />
              </div>
            </div> : <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <CounterControl 
                  label="Acqua Nat."
                  value={stillWater} 
                  onChange={handleStillWaterChange} 
                  className="text-center" 
                />
                <CounterControl
                  label="Acqua Gas." 
                  value={sparklingWater} 
                  onChange={handleSparklingWaterChange} 
                  className="text-center" 
                />
                <CounterControl 
                  label="Pane" 
                  value={bread} 
                  onChange={handleBreadChange} 
                  className="text-center" 
                />
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Prodotti</h3>
                  <Button variant="outline" size="sm" onClick={() => setIsItemModalOpen(true)} className="flex items-center">
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi
                  </Button>
                </div>
                
                <div className="max-h-96 overflow-y-auto pr-1">
                  {order.items.length === 0 ? <p className="text-muted-foreground text-center py-4">
                      Nessun prodotto nell'ordine
                    </p> : <div className="space-y-1">
                      {order.items.map(item => 
                        <OrderItemRow 
                          key={item.id} 
                          item={item} 
                          onUpdateQuantity={handleUpdateQuantity} 
                          onDeleteItem={handleDeleteItem} 
                        />
                      )}
                    </div>}
                </div>
                
                <div className="flex justify-between items-center mt-6 text-lg font-semibold">
                  <span>Totale</span>
                  <span>
                    {new Intl.NumberFormat('it-IT', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>}
        </CardContent>
      </Card>

      {completedOrders.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Ordini completati</h2>
          <CompletedOrdersList orders={completedOrders} />
        </div>
      )}

      <AddItemModal open={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} onAddItem={handleAddItem} />
    </div>;
};

export default TableOrders;
