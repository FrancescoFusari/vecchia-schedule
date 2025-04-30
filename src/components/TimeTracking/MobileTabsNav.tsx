
import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface MobileTabsNavProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MobileTabsNav({ options, value, onChange, className }: MobileTabsNavProps) {
  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
      <div className={cn(
        "glassmorphic rounded-2xl mx-auto flex justify-between items-center py-2 px-1",
        className
      )}>
        {options.map((option) => (
          <button
            key={option.value}
            className={cn(
              "flex-1 py-2 px-4 text-sm font-medium rounded-xl transition-all duration-200",
              value === option.value 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-background/50"
            )}
            onClick={() => onChange(option.value)}
          >
            <div className="flex items-center justify-center gap-1.5">
              {option.icon}
              <span>{option.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
