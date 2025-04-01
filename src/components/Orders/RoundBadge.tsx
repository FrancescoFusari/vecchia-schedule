
import { Badge } from "@/components/ui/badge";

interface RoundBadgeProps {
  status: 'pending' | 'preparing' | 'served' | 'completed';
  className?: string;
}

export function RoundBadge({ status, className = "" }: RoundBadgeProps) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
    pending: { variant: "outline", label: "In attesa" },
    preparing: { variant: "secondary", label: "In preparazione" },
    served: { variant: "default", label: "Servito" },
    completed: { variant: "secondary", label: "Completato" } // Changed from 'success' to 'secondary'
  };

  const { variant, label } = variants[status] || variants.pending;

  return (
    <Badge variant={variant} className={`${className} ${status === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}`}>
      {label}
    </Badge>
  );
}
