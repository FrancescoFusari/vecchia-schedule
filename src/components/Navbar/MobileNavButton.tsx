
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileNavButtonProps {
  to: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}

export function MobileNavButton({
  to,
  icon,
  isActive,
  onClick,
}: MobileNavButtonProps) {
  return (
    <Link 
      to={to} 
      className="flex-1" 
      onClick={onClick}
    >
      <Button
        variant="ghost"
        size="mobileNav"
        className={cn(
          "flex items-center justify-center w-full h-full transition-all duration-300",
          isActive 
            ? "text-primary after:absolute after:bottom-1 after:left-1/3 after:w-1/3 after:h-1 after:bg-primary after:rounded-full after:transition-all after:duration-300"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {icon}
      </Button>
    </Link>
  );
}
