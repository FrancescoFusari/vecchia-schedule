
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RestaurantSection, RestaurantTable, Order } from "@/lib/types";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getTables, getActiveOrder } from "@/lib/restaurant-service";
import { Button } from "@/components/ui/button";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import { TableManagementDialog } from "./TableManagementDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabaseCustom as supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TableTimer } from "./TableTimer";

interface SectionCardProps {
  section: RestaurantSection;
  className?: string;
}

interface TableWithOrderInfo extends RestaurantTable {
  hasActiveOrder?: boolean;
  orderCreatedAt?: string | null;
}

export function SectionCard({ section, className = "" }: SectionCardProps) {
  const [tables, setTables] = useState<TableWithOrderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableManagementOpen, setIsTableManagementOpen] = useState(false);
  const [activeTables, setActiveTables] = useState<TableWithOrderInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsLoading(true);
        const tablesData = await getTables(section.id);
        
        // Check which tables have active orders
        const tablesWithOrderStatus = await Promise.all(
          tablesData.map(async (table) => {
            const activeOrder = await getActiveOrder(table.id);
            return {
              ...table,
              hasActiveOrder: !!activeOrder,
              orderCreatedAt: activeOrder ? activeOrder.createdAt : null
            };
          })
        );
        
        // Sort tables by number
        const sortedTables = tablesWithOrderStatus.sort((a, b) => 
          a.tableNumber - b.tableNumber
        );
        
        setTables(sortedTables);
        const activeTablesFiltered = sortedTables.filter(table => table.hasActiveOrder);
        setActiveTables(activeTablesFiltered);
        
        // Set isOpen to true only if this section has active tables
        if (activeTablesFiltered.length > 0 && !isOpen) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Error fetching tables for section:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTables();

    // Set up real-time listeners for table changes
    const tablesChannel = supabase
      .channel('restaurant_tables_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'restaurant_tables',
        filter: `section_id=eq.${section.id}`
      }, () => {
        // Refresh the tables whenever there's a change
        fetchTables();
      })
      .subscribe();
      
    // Set up real-time listeners for order changes
    const ordersChannel = supabase
      .channel('orders_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        // Refresh the tables to update active status
        fetchTables();
      })
      .subscribe();

    // Clean up the channel subscription when the component unmounts
    return () => {
      supabase.removeChannel(tablesChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [section.id, isTableManagementOpen]);

  const getActiveBadge = () => {
    if (activeTables.length === 0) return null;
    
    return (
      <Badge variant="secondary" className="ml-2">
        {activeTables.length} {activeTables.length === 1 ? 'attivo' : 'attivi'}
      </Badge>
    );
  };

  return (
    <>
      <Card className={`${className} overflow-hidden`}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center px-6 py-4">
            <div className="flex-1">
              <CardTitle className="text-xl font-medium flex items-center">
                {section.name}
                {getActiveBadge()}
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="sr-only">{isOpen ? 'Chiudi' : 'Apri'}</span>
                </Button>
              </CollapsibleTrigger>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setIsTableManagementOpen(true)}
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Gestisci tavoli</span>
              </Button>
            </div>
          </div>
          
          <CollapsibleContent>
            <CardContent className="pt-0 pb-6">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : tables.length === 0 ? (
                <p className="text-muted-foreground text-center py-2">Nessun tavolo disponibile</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {tables.map((table) => (
                    <Link key={table.id} to={`/orders/tables/${table.id}`}>
                      <div className="w-full">
                        <Button
                          variant={table.hasActiveOrder ? "outline" : "outline"}
                          className={`w-full h-full aspect-square flex flex-col items-center justify-center relative 
                            ${
                              table.hasActiveOrder 
                                ? "bg-primary/20 text-primary border-primary hover:bg-primary/30" 
                                : ""
                            }`}
                        >
                          <span className="text-lg font-semibold">{table.tableNumber}</span>
                          <span className="text-xs">{table.seats} posti</span>
                          
                          {table.hasActiveOrder && table.orderCreatedAt && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                              <TableTimer 
                                startTime={table.orderCreatedAt} 
                                variant="blue" 
                                size="sm"
                              />
                            </div>
                          )}
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
          
          {!isOpen && activeTables.length > 0 && (
            <div className="px-6 pb-6 pt-0">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {activeTables.map((table) => (
                  <Link key={table.id} to={`/orders/tables/${table.id}`}>
                    <div className="w-full">
                      <Button
                        variant="outline"
                        className="w-full h-full aspect-square flex flex-col items-center justify-center relative
                          bg-primary/20 text-primary border-primary hover:bg-primary/30"
                      >
                        <span className="text-lg font-semibold">{table.tableNumber}</span>
                        <span className="text-xs">{table.seats} posti</span>
                        
                        {table.orderCreatedAt && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                            <TableTimer 
                              startTime={table.orderCreatedAt} 
                              variant="blue" 
                              size="sm"
                            />
                          </div>
                        )}
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Collapsible>
      </Card>

      <TableManagementDialog 
        isOpen={isTableManagementOpen}
        onClose={() => setIsTableManagementOpen(false)}
        sectionId={section.id}
      />
    </>
  );
}
