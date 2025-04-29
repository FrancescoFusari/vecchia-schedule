
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
        className={`flex ${isMobile ? 'flex-col h-auto w-full' : 'items-center'}`}
      >
        <Clock className={isMobile ? "h-4 w-4 mb-1" : "mr-2 h-4 w-4"} />
        <span className={isMobile ? "text-[10px] leading-tight" : ""}>Riepilogo Ore</span>
      </Button>
    </Link>
  );
}
