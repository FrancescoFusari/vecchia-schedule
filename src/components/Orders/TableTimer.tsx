
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface TableTimerProps {
  startTime: string | null;
  className?: string;
  variant?: "orange" | "blue" | "default";
  size?: "sm" | "md";
}

export const TableTimer = ({ 
  startTime, 
  className = "", 
  variant = "orange",
  size = "md"
}: TableTimerProps) => {
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
  
  // Size classes for the badge and icon
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs"
  };
  
  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5"
  };
  
  return (
    <Badge 
      variant={variant} 
      className={`flex items-center gap-1.5 ${sizeClasses[size]} ${className}`}
    >
      <Clock className={iconSizeClasses[size]} />
      <span className={`font-mono font-medium ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>{elapsedTime}</span>
    </Badge>
  );
};
