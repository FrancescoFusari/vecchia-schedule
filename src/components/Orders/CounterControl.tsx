
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CounterControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  className?: string;
}

export function CounterControl({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
  className = "",
}: CounterControlProps) {
  const isMobile = useIsMobile();
  
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="text-sm font-medium mb-3">{label}</span>
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full touch-manipulation border-2"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <div className="w-12 text-center font-semibold text-xl mx-3">{value}</div>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full touch-manipulation border-2"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
