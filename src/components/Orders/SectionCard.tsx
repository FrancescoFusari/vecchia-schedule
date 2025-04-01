
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RestaurantSection, RestaurantTable } from "@/lib/types";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getTables } from "@/lib/restaurant-service";
import { Button } from "@/components/ui/button";

interface SectionCardProps {
  section: RestaurantSection;
  className?: string;
}

export function SectionCard({ section, className = "" }: SectionCardProps) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsLoading(true);
        const tablesData = await getTables(section.id);
        setTables(tablesData);
      } catch (error) {
        console.error("Error fetching tables for section:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTables();
  }, [section.id]);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">{section.name}</CardTitle>
      </CardHeader>
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
                  variant="outline"
                  className="w-full h-full aspect-square flex flex-col items-center justify-center"
                >
                  <span className="text-lg font-semibold">{table.tableNumber}</span>
                  <span className="text-xs text-muted-foreground">{table.seats} posti</span>
                </Button>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
