
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
      <span className="text-sm font-medium mb-2">Acqua</span>
      
      <div className="flex flex-col items-center mb-3">
        <Toggle 
          pressed={isSparkling} 
          onPressedChange={onTypeChange}
          size="sm"
          className={`h-8 px-3 border border-input flex items-center gap-2 transition-colors ${
            isSparkling 
              ? "bg-blue-500/20 text-blue-600 border-blue-400 data-[state=on]:bg-blue-500/30 hover:bg-blue-500/40" 
              : "data-[state=on]:bg-slate-100"
          }`}
          aria-label="Toggle sparkling water"
        >
          {isSparkling 
            ? <Droplets className="h-3.5 w-3.5 text-blue-600" /> 
            : <Droplet className="h-3.5 w-3.5" />
          }
          <span className="text-xs font-medium">{isSparkling ? "Frizzante" : "Naturale"}</span>
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
