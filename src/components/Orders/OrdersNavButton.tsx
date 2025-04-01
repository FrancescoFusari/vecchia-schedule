
import { Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

export function OrdersNavButton({ isMobile = false }) {
  const location = useLocation();
  const isActive = location.pathname === "/orders";
  
  return (
    <Link to="/orders">
      <Button
        variant={isActive ? "default" : "ghost"}
        size={isMobile ? "mobileNav" : "sm"}
        className={`flex ${isMobile ? 'flex-col h-auto w-full' : 'items-center'}`}
      >
        <Utensils className={isMobile ? "h-4 w-4 mb-1" : "mr-2 h-4 w-4"} />
        <span className={isMobile ? "text-[10px] leading-tight" : ""}>Comande</span>
      </Button>
    </Link>
  );
}
