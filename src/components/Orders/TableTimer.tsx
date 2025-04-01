
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface TableTimerProps {
  startTime: string | null;
  className?: string;
  variant?: "default" | "orange";
}

export const TableTimer = ({ startTime, className, variant = "default" }: TableTimerProps) => {
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  
  useEffect(() => {
    if (!startTime) return;
    
    const startDate = new Date(startTime);
    
    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      
      // Convert to hours, minutes, seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Format as HH:MM:SS
      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');
      
      setElapsedTime(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
    };
    
    // Update immediately and then every second
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);
  
  if (!startTime) return null;
  
  const variantClasses = variant === "orange" 
    ? "border-orange-300 bg-orange-100/60 text-orange-700" 
    : "bg-background/50 backdrop-blur-sm";
  
  return (
    <Badge 
      variant="outline" 
      className={`px-3 py-1 flex items-center gap-1.5 ${variantClasses} ${className}`}
    >
      <Clock className={`h-3.5 w-3.5 ${variant === "orange" ? "text-orange-500" : ""}`} />
      <span className={`font-mono text-xs ${variant === "orange" ? "text-orange-700" : ""}`}>{elapsedTime}</span>
    </Badge>
  );
};
