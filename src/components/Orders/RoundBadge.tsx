
import { Badge } from "@/components/ui/badge";

interface RoundBadgeProps {
  status: 'pending' | 'preparing' | 'served' | 'completed';
  className?: string;
}

export function RoundBadge({ status, className = "" }: RoundBadgeProps) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" | "success", label: string }> = {
    pending: { variant: "outline", label: "In attesa" },
    preparing: { variant: "secondary", label: "In preparazione" },
    served: { variant: "default", label: "Servito" },
    completed: { variant: "success", label: "Completato" }
  };

  const { variant, label } = variants[status] || variants.pending;

  return (
    <Badge variant={variant as any} className={className}>
      {label}
    </Badge>
  );
}
