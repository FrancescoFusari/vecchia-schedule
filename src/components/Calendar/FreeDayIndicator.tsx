
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FreeDayIndicatorProps {
  date: Date;
}

export function FreeDayIndicator({ date }: FreeDayIndicatorProps) {
  const [emoji, setEmoji] = useState("😎");
  const emojis = ["🎉", "😎", "🌴", "🏖️", "✨", "🎮", "💤", "🍹"];
  
  // Change emoji every few seconds for a fun animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="px-4 py-3 mb-2 rounded-md border border-dashed border-primary/40 bg-primary/5 text-center animate-pulse transition-all">
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xl animate-bounce">{emoji}</span>
        <span className="text-sm font-medium text-primary/80">Giorno libero!</span>
      </div>
    </div>
  );
}
