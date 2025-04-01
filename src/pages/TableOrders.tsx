
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getActiveOrder, 
  createOrder, 
  updateOrder, 
  createOrderRound, 
  addOrderItems,
  updateRoundStatus,
  updateOrderItem,
  deleteOrderItem
} from "@/lib/restaurant-service";
import { employeeService } from "@/lib/supabase";
import { OrderWithItems, Employee, CartItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  ClipboardList, 
  Coffee, 
  PanelTop 
} from "lucide-react";
import { CounterControl } from "@/components/Orders/CounterControl";
import { AddItemModal } from "@/components/Orders/AddItemModal";
import { RoundItem } from "@/components/Orders/RoundItem";
import { OrderItemRow } from "@/components/Orders/OrderItemRow";
import { RoundBadge } from "@/components/Orders/RoundBadge";

function TableOrders() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch current order
        if (tableId) {
          const orderData = await getActiveOrder(tableId);
          setOrder(orderData);
        }
        
        // Fetch employees for employee assignment
        const employeesData = await employeeService.getEmployees();
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching order data:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati dell'ordine",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [tableId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleCreateOrder = async () => {
    if (!tableId || !user) return;
    
    try {
      setCreatingOrder(true);
      
      const newOrder = await createOrder(tableId, user.id);
      setOrder({
        ...newOrder,
        items: [],
        table: { id: tableId, sectionId: "", tableNumber: 0, seats: 0, createdAt: "" }
      });
      
      toast({
        title: "Ordine creato",
        description: "Nuovo ordine creato con successo"
      });
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Errore",
        description: "Impossibile creare l'ordine",
        variant: "destructive",
      });
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleAddItems = async (items: CartItem[], roundNumber: number = 1) => {
    if (!order) return;
    
    try {
      // Check if a round with this number already exists
      let roundId: string | undefined;
      let existingRound = order.rounds?.find(r => r.roundNumber === roundNumber);
      
      if (!existingRound) {
        // Create a new round
        const newRound = await createOrderRound(order.id, roundNumber);
        roundId = newRound.id;
      } else {
        roundId = existingRound.id;
      }
      
      // Add items to the order with round ID
      await addOrderItems(order.id, items, roundId);
      
      // Refresh order data
      if (tableId) {
        const refreshedOrder = await getActiveOrder(tableId);
        setOrder(refreshedOrder);
      }
      
      toast({
        title: "Prodotti aggiunti",
        description: `${items.reduce((sum, item) => sum + item.quantity, 0)} prodotti aggiunti al giro ${roundNumber}`
      });
    } catch (error) {
      console.error("Error adding items to order:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere i prodotti all'ordine",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCounter = async (type: 'still' | 'sparkling' | 'bread', value: number) => {
    if (!order) return;
    
    try {
      let updatedOrder;
      if (type === 'still') {
        updatedOrder = await updateOrder(order.id, value, undefined, undefined);
      } else if (type === 'sparkling') {
        updatedOrder = await updateOrder(order.id, undefined, value, undefined);
      } else {
        updatedOrder = await updateOrder(order.id, undefined, undefined, value);
      }
      
      // Update local state
      setOrder(prev => prev ? { ...prev, ...updatedOrder } : null);
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      toast({
        title: "Errore",
        description: `Impossibile aggiornare ${type === 'still' ? 'acqua naturale' : type === 'sparkling' ? 'acqua frizzante' : 'pane'}`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateRoundStatus = async (roundId: string, status: 'pending' | 'preparing' | 'served' | 'completed') => {
    try {
      await updateRoundStatus(roundId, status);
      
      // Refresh order data
      if (tableId) {
        const refreshedOrder = await getActiveOrder(tableId);
        setOrder(refreshedOrder);
      }
      
      toast({
        title: "Stato aggiornato",
        description: `Stato del giro aggiornato con successo`
      });
    } catch (error) {
      console.error("Error updating round status:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato del giro",
        variant: "destructive",
      });
    }
  };

  const handleUpdateOrderItem = async (itemId: string, quantity: number) => {
    try {
      await updateOrderItem(itemId, quantity);
      
      // Refresh order data
      if (tableId) {
        const refreshedOrder = await getActiveOrder(tableId);
        setOrder(refreshedOrder);
      }
    } catch (error) {
      console.error("Error updating order item:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la quantità del prodotto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrderItem = async (itemId: string) => {
    try {
      await deleteOrderItem(itemId);
      
      // Refresh order data
      if (tableId) {
        const refreshedOrder = await getActiveOrder(tableId);
        setOrder(refreshedOrder);
      }
      
      toast({
        title: "Prodotto rimosso",
        description: "Prodotto rimosso con successo"
      });
    } catch (error) {
      console.error("Error deleting order item:", error);
      toast({
        title: "Errore",
        description: "Impossibile rimuovere il prodotto",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-4 animate-pulse">
        <div className="flex items-center mb-6">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-6 w-48 ml-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        
        <div className="grid gap-4">
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
          <div className="h-60 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {order ? `Tavolo ${order.table.tableNumber}` : 'Nuovo ordine'}
        </h1>
        {order && (
          <Badge variant="outline" className="ml-2">
            Ordine #{order.id.slice(0, 8)}
          </Badge>
        )}
      </div>

      {!order ? (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-center mb-4">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">Nessun ordine attivo</h3>
              <p className="text-muted-foreground mt-1">
                Crea un nuovo ordine per questo tavolo
              </p>
            </div>
            <Button onClick={handleCreateOrder} disabled={creatingOrder}>
              {creatingOrder ? "Creazione in corso..." : "Crea ordine"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Riepilogo ordine</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsAddingItem(true)}
                    className="h-8 px-2"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Aggiungi
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <CounterControl
                    label="Acqua nat."
                    value={order.stillWater}
                    onChange={(value) => handleUpdateCounter('still', value)}
                    icon={<PanelTop className="h-4 w-4" />}
                  />
                  <CounterControl
                    label="Acqua gas."
                    value={order.sparklingWater}
                    onChange={(value) => handleUpdateCounter('sparkling', value)}
                    icon={<PanelTop className="h-4 w-4" />}
                  />
                  <CounterControl
                    label="Pane"
                    value={order.bread}
                    onChange={(value) => handleUpdateCounter('bread', value)}
                    icon={<Coffee className="h-4 w-4" />}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Rounds Section */}
          <h2 className="text-xl font-bold mb-4">Giri</h2>
          
          {(!order.rounds || order.rounds.length === 0) && (!order.items || order.items.length === 0) ? (
            <Card className="mb-6">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="text-center mb-4">
                  <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium">Nessun prodotto</h3>
                  <p className="text-muted-foreground mt-1">
                    Aggiungi prodotti all'ordine
                  </p>
                </div>
                <Button onClick={() => setIsAddingItem(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Aggiungi prodotti
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Display items without round assignment first */}
              {order.items && order.items.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Prodotti senza giro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <OrderItemRow 
                          key={item.id} 
                          item={item} 
                          onUpdateQuantity={handleUpdateOrderItem}
                          onDeleteItem={handleDeleteOrderItem}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Display rounds */}
              {order.rounds && order.rounds.map(round => (
                <Card key={round.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <div className="flex items-center">
                        <span>Giro {round.roundNumber}</span>
                        <RoundBadge status={round.status} className="ml-2" />
                      </div>
                      <div className="flex space-x-2">
                        <RoundItem
                          round={round}
                          onUpdateStatus={handleUpdateRoundStatus}
                        />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {round.items.map(item => (
                        <OrderItemRow 
                          key={item.id} 
                          item={item} 
                          onUpdateQuantity={handleUpdateOrderItem}
                          onDeleteItem={handleDeleteOrderItem}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {isAddingItem && order && (
        <AddItemModal
          isOpen={isAddingItem}
          onClose={() => setIsAddingItem(false)}
          onAddItems={handleAddItems}
        />
      )}
    </div>
  );
}

export default TableOrders;
