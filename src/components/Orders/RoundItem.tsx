
import { OrderRound, OrderItem, MenuItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface RoundItemProps {
  round: OrderRound & { items: (OrderItem & { menuItem: MenuItem })[] };
  onUpdateStatus: (roundId: string, status: 'pending' | 'preparing' | 'served' | 'completed') => void;
}

export function RoundItem({ round, onUpdateStatus }: RoundItemProps) {
  const getStatusBadge = () => {
    switch (round.status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1 font-normal">
          <Clock className="h-3 w-3" /> In attesa
        </Badge>;
      case 'preparing':
        return <Badge variant="secondary" className="flex items-center gap-1 font-normal">
          <AlertCircle className="h-3 w-3" /> In preparazione
        </Badge>;
      case 'served':
        return <Badge variant="success" className="flex items-center gap-1 font-normal">
          <CheckCircle2 className="h-3 w-3" /> Servito
        </Badge>;
      case 'completed':
        return <Badge variant="default" className="flex items-center gap-1 font-normal">
          <CheckCircle2 className="h-3 w-3" /> Completato
        </Badge>;
      default:
        return null;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: it
      });
    } catch (e) {
      return dateString;
    }
  };

  const getNextStatus = () => {
    switch (round.status) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'served';
      case 'served':
        return 'completed';
      default:
        return round.status;
    }
  };

  const getNextStatusText = () => {
    switch (round.status) {
      case 'pending':
        return 'Segna in preparazione';
      case 'preparing':
        return 'Segna come servito';
      case 'served':
        return 'Segna come completato';
      default:
        return '';
    }
  };

  const handleUpdateStatus = () => {
    const nextStatus = getNextStatus();
    onUpdateStatus(round.id, nextStatus as any);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Portata {round.roundNumber}</h3>
            {getStatusBadge()}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTime(round.createdAt)}
          </span>
        </div>

        <div className="space-y-2 mt-3">
          {round.items.map(item => (
            <div key={item.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
              <div>
                <span className="font-medium">{item.menuItem.name}</span>
                {item.notes && (
                  <p className="text-xs text-muted-foreground">{item.notes}</p>
                )}
              </div>
              <span className="font-medium">x{item.quantity}</span>
            </div>
          ))}
        </div>

        {round.status !== 'completed' && (
          <Button 
            className="w-full mt-3" 
            variant={round.status === 'pending' ? 'outline' : 'default'}
            onClick={handleUpdateStatus}
          >
            {getNextStatusText()}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
