
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileNavButtonProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  showLabel?: boolean;
}

export function MobileNavButton({
  to,
  icon,
  label,
  isActive,
  onClick,
  showLabel = false,
}: MobileNavButtonProps) {
  return (
    <Link 
      to={to} 
      className="flex-1" 
      onClick={onClick}
      aria-label={label}
    >
      <Button
        variant={isActive ? "default" : "ghost"}
        size="mobileNav"
        className={cn(
          "flex flex-col items-center justify-center w-full h-full transition-all duration-300",
          isActive ? "bg-primary/20 text-primary hover:bg-primary/30" : "hover:bg-background/20"
        )}
      >
        <div className="flex flex-col items-center">
          {icon}
          {showLabel && <span className="text-[10px] font-medium mt-1">{label}</span>}
        </div>
      </Button>
    </Link>
  );
}
