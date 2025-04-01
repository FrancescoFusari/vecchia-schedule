
import { Button } from "@/components/ui/button";
import { Minus, Plus, Droplet, Droplets } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

interface WaterControlProps {
  value: number;
  isSparkling: boolean;
  onValueChange: (value: number) => void;
  onTypeChange: (isSparkling: boolean) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function WaterControl({
  value,
  isSparkling,
  onValueChange,
  onTypeChange,
  min = 0,
  max = 99,
  className = "",
}: WaterControlProps) {
  const handleIncrement = () => {
    if (value < max) {
      onValueChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onValueChange(value - 1);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center mb-2 gap-1">
        <span className="text-sm font-medium">Acqua</span>
        <Toggle 
          pressed={isSparkling} 
          onPressedChange={onTypeChange}
          size="sm"
          className="h-6 px-2 ml-1 data-[state=on]:bg-blue-500/20"
          aria-label="Toggle sparkling water"
        >
          {isSparkling ? <Droplets className="h-3 w-3" /> : <Droplet className="h-3 w-3" />}
        </Toggle>
      </div>
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
