
import { FlaskConical, MessageSquare, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ExperimentalNavMenu({ isMobile = false }) {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={isMobile ? "mobileNav" : "sm"}
          className={`flex ${isMobile ? 'flex-col h-auto w-full' : 'items-center'}`}
        >
          <FlaskConical className={isMobile ? "h-4 w-4 mb-1" : "mr-2 h-4 w-4"} />
          <span className={isMobile ? "text-[10px] leading-tight" : ""}>Sperimentale</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/communications" className="w-full">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Comunicazioni</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/orders" className="w-full">
            <Utensils className="h-4 w-4 mr-2" />
            <span>Comande</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
