import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { RestaurantTable, OrderWithItems } from "@/lib/types";
import { getTables, getActiveOrder, getCompletedOrders, createOrder, updateOrder, addOrderItem, updateOrderItem, deleteOrderItem } from "@/lib/restaurant-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, MoreVertical, Utensils } from "lucide-react";
import { CounterControl } from "@/components/Orders/CounterControl";
import { WaterControl } from "@/components/Orders/WaterControl";
import { OrderItemRow } from "@/components/Orders/OrderItemRow";
import { AddItemModal } from "@/components/Orders/AddItemModal";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CompletedOrdersList } from "@/components/Orders/CompletedOrdersList";
import { TableTimer } from "@/components/Orders/TableTimer";

const TableOrders = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [completedOrders, setCompletedOrders] = useState<OrderWithItems[]>([]);
  const [waterAmount, setWaterAmount] = useState(0);
  const [isSparkling, setIsSparkling] = useState(false);
  const [bread, setBread] = useState(0);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { tableId } = useParams<{ tableId: string; }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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
          const totalWater = activeOrder.stillWater + activeOrder.sparklingWater;
          setWaterAmount(totalWater);
          setIsSparkling(activeOrder.sparklingWater > 0);
          setBread(activeOrder.bread);
        }

        const completed = await getCompletedOrders(tableId);
        const typedOrders: OrderWithItems[] = completed.map(order => ({
          ...order,
          status: order.status as "active" | "completed" | "cancelled"
        }));
        setCompletedOrders(typedOrders);
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

  const handleWaterChange = async (value: number) => {
    setWaterAmount(value);
    if (!order || !user) return;
    
    try {
      setIsSaving(true);
      const stillWater = isSparkling ? 0 : value;
      const sparklingWater = isSparkling ? value : 0;
      
      await updateOrder(order.id, stillWater, sparklingWater, undefined);
    } catch (error) {
      console.error("Error updating water:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'acqua",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWaterTypeChange = async (sparklingValue: boolean) => {
    setIsSparkling(sparklingValue);
    if (!order || !user || waterAmount === 0) return;
    
    try {
      setIsSaving(true);
      const stillWater = sparklingValue ? 0 : waterAmount;
      const sparklingWater = sparklingValue ? waterAmount : 0;
      
      await updateOrder(order.id, stillWater, sparklingWater, undefined);
    } catch (error) {
      console.error("Error updating water type:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il tipo di acqua",
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
      const stillWater = isSparkling ? 0 : waterAmount;
      const sparklingWater = isSparkling ? waterAmount : 0;
      
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
      
      const hasSeparator = order.items.some(item => item.isLastFirstCourse);
      
      await addOrderItem(order.id, menuItemId, quantity, notes);

      const updatedOrder = await getActiveOrder(tableId!);
      
      if (hasSeparator) {
        const separatorIndex = order.items.findIndex(item => item.isLastFirstCourse);
        
        if (separatorIndex !== -1 && updatedOrder) {
          const newItem = updatedOrder.items[updatedOrder.items.length - 1];
          
          const itemsWithoutNewest = updatedOrder.items.slice(0, updatedOrder.items.length - 1);
          
          const firstCourseItems = itemsWithoutNewest.slice(0, separatorIndex + 1);
          const secondCourseItems = itemsWithoutNewest.slice(separatorIndex + 1);
          
          const rearrangedItems = [
            ...firstCourseItems,
            ...secondCourseItems,
            newItem
          ];
          
          setOrder({
            ...updatedOrder,
            items: rearrangedItems
          });
        } else {
          setOrder(updatedOrder);
        }
      } else {
        setOrder(updatedOrder);
      }
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
      const deletedItemWasSeparator = order.items.find(item => item.id === itemId)?.isLastFirstCourse;
      
      await deleteOrderItem(itemId);
      
      const updatedItems = order.items.filter(item => item.id !== itemId);
      
      if (deletedItemWasSeparator && updatedItems.length > 0) {
        const deletedItemIndex = order.items.findIndex(item => item.id === itemId);
        if (deletedItemIndex > 0) {
          const previousItemId = updatedItems[deletedItemIndex - 1].id;
          await updateOrderItem(previousItemId, updatedItems[deletedItemIndex - 1].quantity, 
            updatedItems[deletedItemIndex - 1].notes, true);
          updatedItems[deletedItemIndex - 1].isLastFirstCourse = true;
        }
      }
      
      setOrder({
        ...order,
        items: updatedItems
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
      
      const completedOrder: OrderWithItems = {
        ...order,
        status: 'completed'
      };
      setCompletedOrders([completedOrder, ...completedOrders]);
      
      setOrder(null);
      setWaterAmount(0);
      setIsSparkling(false);
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

  const handleAddSecondCourse = async () => {
    if (!order || !user || order.items.length === 0) return;
    
    try {
      setIsSaving(true);
      
      for (const item of order.items) {
        if (item.isLastFirstCourse) {
          await updateOrderItem(item.id, item.quantity, item.notes, false);
        }
      }
      
      const lastItem = order.items[order.items.length - 1];
      await updateOrderItem(lastItem.id, lastItem.quantity, lastItem.notes, true);
      
      const updatedItems = [...order.items];
      updatedItems.forEach(item => item.isLastFirstCourse = false);
      updatedItems[updatedItems.length - 1].isLastFirstCourse = true;
      
      setOrder({
        ...order,
        items: updatedItems
      });
      
      toast({
        title: "Aggiornato",
        description: "Separazione dei corsi aggiornata"
      });
    } catch (error) {
      console.error("Error adding second course:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il secondo corso",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNotes = async (itemId: string, notes: string) => {
    if (!order || !user) return;
    try {
      await updateOrderItem(itemId, 
        order.items.find(item => item.id === itemId)?.quantity || 1, 
        notes,
        order.items.find(item => item.id === itemId)?.isLastFirstCourse
      );

      setOrder({
        ...order,
        items: order.items.map(item => item.id === itemId ? {
          ...item,
          notes
        } : item)
      });
      
      toast({
        title: "Aggiornato",
        description: "Note aggiornate"
      });
    } catch (error) {
      console.error("Error updating notes:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare le note",
        variant: "destructive"
      });
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
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">
            {order ? 'Ordine attivo' : 'Nessun ordine attivo'}
          </h2>
          {order && <TableTimer startTime={order.createdAt} variant="orange" />}
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
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">
                {order ? 'Ordine attivo' : 'Nessun ordine attivo'}
              </h2>
              {order && <TableTimer startTime={order.createdAt} variant="orange" />}
            </div>
            
            {!order && <Button onClick={handleAddNewOrder} disabled={isSaving}>
                {isSaving ? "Creazione..." : "Nuovo ordine"}
              </Button>}
          </div>

          {!order ? <div className="space-y-4">
              <p className="text-muted-foreground">
                Non ci sono ordini attivi per questo tavolo. Clicca su "Nuovo ordine" per iniziare.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6 mt-6">
                <WaterControl 
                  value={waterAmount}
                  isSparkling={isSparkling}
                  onValueChange={setWaterAmount}
                  onTypeChange={setIsSparkling}
                  className="col-span-1"
                />
                <CounterControl 
                  label="Pane" 
                  value={bread} 
                  onChange={setBread} 
                  className="col-span-1"
                />
              </div>
            </div> : <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
                <WaterControl 
                  value={waterAmount}
                  isSparkling={isSparkling}
                  onValueChange={handleWaterChange}
                  onTypeChange={handleWaterTypeChange}
                  className="col-span-1"
                />
                <CounterControl 
                  label="Pane" 
                  value={bread} 
                  onChange={handleBreadChange} 
                  className="col-span-1"
                />
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Prodotti</h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddSecondCourse} 
                      className="flex items-center"
                    >
                      <Utensils className="h-4 w-4 mr-1" />
                      Secondo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsItemModalOpen(true)} 
                      className="flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Aggiungi
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto pr-1">
                  {order.items.length === 0 ? <p className="text-muted-foreground text-center py-4">
                      Nessun prodotto nell'ordine
                    </p> : <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <>
                          <OrderItemRow 
                            key={item.id} 
                            item={item} 
                            onUpdateQuantity={handleUpdateQuantity} 
                            onDeleteItem={handleDeleteItem} 
                            onUpdateNotes={handleUpdateNotes}
                          />
                          {item.isLastFirstCourse && (
                            <div className="my-3">
                              <Separator className="bg-primary/30 h-[2px]" />
                              <div className="flex justify-center -mt-[1px]">
                                <span className="bg-background px-2 text-xs text-muted-foreground">
                                  Secondi
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      ))}
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

      <AddItemModal 
        open={isItemModalOpen} 
        onClose={() => setIsItemModalOpen(false)} 
        onAddItem={handleAddItem} 
        currentOrderItems={order?.items}
      />
    </div>;
};

export default TableOrders;
