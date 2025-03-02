
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, LogOut, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

export function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  if (!user) return null;

  return (
    <nav className={`bg-white shadow-sm ${isMobile ? 'fixed bottom-0 left-0 right-0 z-50 border-t' : 'border-b'}`}>
      <div className={`container mx-auto ${isMobile ? 'px-2 py-2' : 'px-4 py-3'}`}>
        <div className="flex justify-between items-center">
          {!isMobile && (
            <div className="flex space-x-1">
              <Link to="/" className="flex items-center text-lg font-semibold text-primary">
                <CalendarDays className="mr-2 h-6 w-6" />
                WorkShift
              </Link>
            </div>
          )}

          <div className={`flex items-center ${isMobile ? 'w-full justify-around' : 'space-x-2'}`}>
            {/* Main navigation links */}
            <Link to="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size={isMobile ? "mobileNav" : "sm"}
                className={`flex ${isMobile ? 'flex-col h-auto w-full' : 'items-center'}`}
              >
                <CalendarDays className={isMobile ? "h-4 w-4 mb-1" : "mr-2 h-4 w-4"} />
                <span className={isMobile ? "text-[10px] leading-tight" : ""}>Calendario</span>
              </Button>
            </Link>

            {isAdmin() && (
              <>
                <Link to="/employees">
                  <Button
                    variant={isActive("/employees") ? "default" : "ghost"}
                    size={isMobile ? "mobileNav" : "sm"}
                    className={`flex ${isMobile ? 'flex-col h-auto w-full' : 'items-center'}`}
                  >
                    <Users className={isMobile ? "h-4 w-4 mb-1" : "mr-2 h-4 w-4"} />
                    <span className={isMobile ? "text-[10px] leading-tight" : ""}>Dipendenti</span>
                  </Button>
                </Link>
                
                <Link to="/templates">
                  <Button
                    variant={isActive("/templates") ? "default" : "ghost"}
                    size={isMobile ? "mobileNav" : "sm"}
                    className={`flex ${isMobile ? 'flex-col h-auto w-full' : 'items-center'}`}
                  >
                    <Clock className={isMobile ? "h-4 w-4 mb-1" : "mr-2 h-4 w-4"} />
                    <span className={isMobile ? "text-[10px] leading-tight" : ""}>Template</span>
                  </Button>
                </Link>
              </>
            )}

            {/* Logout button */}
            <Button
              variant="ghost"
              size={isMobile ? "mobileNav" : "sm"}
              className={`flex ${isMobile ? 'flex-col h-auto w-full text-destructive' : 'items-center text-destructive'}`}
              onClick={() => signOut()}
            >
              <LogOut className={isMobile ? "h-4 w-4 mb-1" : "mr-2 h-4 w-4"} />
              <span className={isMobile ? "text-[10px] leading-tight" : ""}>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
