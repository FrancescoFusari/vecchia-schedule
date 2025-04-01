
import { Button } from "@/components/ui/button";
import { OrderRound } from "@/lib/types";
import { 
  ClipboardCheck, 
  ChefHat, 
  ArrowRight, 
  Check,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoundItemProps {
  round: OrderRound;
  onUpdateStatus: (roundId: string, status: 'pending' | 'preparing' | 'served' | 'completed') => void;
}

export function RoundItem({ round, onUpdateStatus }: RoundItemProps) {
  const getNextStatusAction = () => {
    switch (round.status) {
      case 'pending':
        return {
          label: "In preparazione",
          icon: <ChefHat className="h-4 w-4 mr-2" />,
          status: 'preparing' as const,
          variant: 'outline' as const
        };
      case 'preparing':
        return {
          label: "Servito",
          icon: <ArrowRight className="h-4 w-4 mr-2" />,
          status: 'served' as const,
          variant: 'default' as const
        };
      case 'served':
        return {
          label: "Completato",
          icon: <Check className="h-4 w-4 mr-2" />,
          status: 'completed' as const,
          variant: 'secondary' as const // Changed from 'success' to 'secondary'
        };
      default:
        return null;
    }
  };

  const nextAction = getNextStatusAction();

  return (
    <>
      {nextAction && (
        <Button
          variant={nextAction.variant}
          size="sm"
          className="h-8"
          onClick={() => onUpdateStatus(round.id, nextAction.status)}
        >
          {nextAction.icon}
          {nextAction.label}
        </Button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onUpdateStatus(round.id, 'pending')}>
            Segna come In attesa
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus(round.id, 'preparing')}>
            Segna come In preparazione
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus(round.id, 'served')}>
            Segna come Servito
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onUpdateStatus(round.id, 'completed')}>
            Segna come Completato
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
