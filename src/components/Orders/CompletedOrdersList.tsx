
import { useState } from "react";
import { OrderWithItems } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronDown, ChevronUp, Droplet, Droplets, Utensils } from "lucide-react";

interface CompletedOrdersListProps {
  orders: OrderWithItems[];
}

export function CompletedOrdersList({ orders }: CompletedOrdersListProps) {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const toggleOrder = (orderId: string) => {
    setOpenOrderId(openOrderId === orderId ? null : orderId);
  };

  const calculateTotal = (order: OrderWithItems) => {
    return order.items.reduce((total, item) => {
      return total + item.menuItem.price * item.quantity;
    }, 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: it });
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="overflow-hidden">
          <Collapsible
            open={openOrderId === order.id}
            onOpenChange={() => toggleOrder(order.id)}
          >
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleOrder(order.id)}>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">Ordine completato</h3>
                  <Badge variant="outline" className="text-sm">
                    {formatDate(order.createdAt)}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  {order.items.length} prodotti · 
                  {order.stillWater > 0 && ` ${order.stillWater} acqua nat. ·`}
                  {order.sparklingWater > 0 && ` ${order.sparklingWater} acqua gas. ·`}
                  {order.bread > 0 && ` ${order.bread} pane ·`}
                  {" "}
                  Totale: {new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(calculateTotal(order))}
                </p>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {openOrderId === order.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4">
                {order.stillWater > 0 || order.sparklingWater > 0 || order.bread > 0 ? (
                  <div className="flex space-x-6 mb-4 text-sm">
                    {order.stillWater > 0 && (
                      <div className="flex items-center">
                        <Droplet className="h-4 w-4 mr-1 text-blue-500" />
                        <span>{order.stillWater} acqua nat.</span>
                      </div>
                    )}
                    {order.sparklingWater > 0 && (
                      <div className="flex items-center">
                        <Droplets className="h-4 w-4 mr-1 text-blue-500" />
                        <span>{order.sparklingWater} acqua gas.</span>
                      </div>
                    )}
                    {order.bread > 0 && (
                      <div className="flex items-center">
                        <Utensils className="h-4 w-4 mr-1 text-amber-600" />
                        <span>{order.bread} pane</span>
                      </div>
                    )}
                  </div>
                ) : null}
                
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm py-1 border-b border-muted last:border-0">
                      <div className="flex-1">
                        <div className="font-medium">{item.menuItem.name}</div>
                        {item.notes && (
                          <div className="text-xs text-muted-foreground">{item.notes}</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 text-center">
                          x{item.quantity}
                        </div>
                        <div className="w-20 text-right">
                          {new Intl.NumberFormat('it-IT', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(item.menuItem.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-4 font-semibold">
                  <span>Totale</span>
                  <span>
                    {new Intl.NumberFormat('it-IT', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(calculateTotal(order))}
                  </span>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
