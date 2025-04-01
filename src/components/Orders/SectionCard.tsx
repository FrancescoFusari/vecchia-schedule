
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

interface SectionCardProps {
  section: RestaurantSection;
  className?: string;
}

interface TableWithOrders extends RestaurantTable {
  hasActiveOrder?: boolean;
}

export function SectionCard({ section, className = "" }: SectionCardProps) {
  const [tables, setTables] = useState<TableWithOrders[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableManagementOpen, setIsTableManagementOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [activeTables, setActiveTables] = useState<TableWithOrders[]>([]);

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
              hasActiveOrder: !!activeOrder
            };
          })
        );
        
        // Sort tables by number
        const sortedTables = tablesWithOrderStatus.sort((a, b) => 
          a.tableNumber - b.tableNumber
        );
        
        setTables(sortedTables);
        setActiveTables(sortedTables.filter(table => table.hasActiveOrder));
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
          <div className="flex items-center justify-between">
            <CardHeader className="pb-2 flex flex-row justify-between items-center flex-grow">
              <div className="flex items-center">
                <CardTitle className="text-xl font-medium">{section.name}</CardTitle>
                {getActiveBadge()}
              </div>
            </CardHeader>
            
            <div className="flex items-center pr-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 mr-2 rounded-full">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="sr-only">{isOpen ? 'Chiudi' : 'Apri'}</span>
                </Button>
              </CollapsibleTrigger>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="h-9 w-9 p-0 rounded-full"
                onClick={() => setIsTableManagementOpen(true)}
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Gestisci tavoli</span>
              </Button>
            </div>
          </div>
          
          <CollapsibleContent>
            <CardContent>
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
                      <Button
                        variant={table.hasActiveOrder ? "default" : "outline"}
                        className={`w-full h-full aspect-square flex flex-col items-center justify-center ${
                          table.hasActiveOrder ? "bg-primary text-primary-foreground" : ""
                        }`}
                      >
                        <span className="text-lg font-semibold">{table.tableNumber}</span>
                        <span className="text-xs">{table.seats} posti</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
          
          {!isOpen && activeTables.length > 0 && (
            <div className="px-6 pb-4 pt-0">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {activeTables.map((table) => (
                  <Link key={table.id} to={`/orders/tables/${table.id}`}>
                    <Button
                      variant="default"
                      className="w-full h-full aspect-square flex flex-col items-center justify-center"
                    >
                      <span className="text-lg font-semibold">{table.tableNumber}</span>
                      <span className="text-xs">{table.seats} posti</span>
                    </Button>
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
