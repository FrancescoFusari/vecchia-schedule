
import { Button } from "@/components/ui/button";
import { Minus, Plus, Droplet, Droplets } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
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
      <div className="flex items-center mb-3 gap-2">
        <span className="text-sm font-medium">Acqua</span>
        <Toggle 
          pressed={isSparkling} 
          onPressedChange={onTypeChange}
          size="sm"
          className="h-6 px-2 data-[state=on]:bg-blue-500/20 border border-input"
          aria-label="Toggle sparkling water"
        >
          {isSparkling ? <Droplets className="h-3.5 w-3.5" /> : <Droplet className="h-3.5 w-3.5" />}
        </Toggle>
      </div>
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
