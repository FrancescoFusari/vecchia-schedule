
import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

export function HoursSummaryNavButton({ isMobile = false }) {
  const location = useLocation();
  const isActive = location.pathname === "/hours-summary";
  
  return (
    <Link to="/hours-summary">
      <Button
        variant={isActive ? "default" : "ghost"}
        size={isMobile ? "mobileNav" : "sm"}
        className={`flex ${isMobile ? 'flex-col h-auto w-full bg-gradient-to-br' : 'items-center'} 
          ${isActive && isMobile ? 'from-purple-600 to-purple-500 text-white' : ''}`}
      >
        <Clock className={`${isMobile ? 'h-5 w-5 mb-1' : 'mr-2 h-4 w-4'} 
          ${isActive ? 'text-white' : ''}`} />
        <span className={isMobile ? "text-[10px] leading-tight" : ""}>Riepilogo Ore</span>
      </Button>
    </Link>
  );
}
