
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

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
      <span className="text-sm font-medium mb-1">{label}</span>
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full touch-manipulation"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="w-10 text-center font-semibold text-lg mx-2">{value}</div>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full touch-manipulation"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
