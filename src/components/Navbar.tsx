
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, User, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

export function Navbar() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  if (!user) return null;

  // Only show dashboard for admin users
  const showDashboard = isAdmin();
  
  // Show profile for regular users
  const showProfile = !showDashboard;

  return (
    <nav className={`bg-white shadow-sm ${isMobile ? 'fixed bottom-0 left-0 right-0 z-50 border-t' : 'border-b'}`}>
      <div className={`container mx-auto ${isMobile ? 'px-2 py-2' : 'px-4 py-3'}`}>
        <div className="flex justify-between items-center">
          {!isMobile && (
            <div className="flex space-x-1">
              <Link to="/" className="flex items-center text-lg font-semibold text-primary">
                <img src="/lovable-uploads/5cec7ef1-53d9-4fab-ba62-9a1137e84da9.png" alt="La Vecchia Signora" className="h-8 mr-2" />
                <span>La Vecchia Signora</span>
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

            {/* Communications link for all users */}
            <Link to="/communications">
              <Button
                variant={isActive("/communications") ? "default" : "ghost"}
                size={isMobile ? "mobileNav" : "sm"}
                className={`flex ${isMobile ? 'flex-col h-auto w-full' : 'items-center'}`}
              >
                <MessageSquare className={isMobile ? "h-4 w-4 mb-1" : "mr-2 h-4 w-4"} />
                <span className={isMobile ? "text-[10px] leading-tight" : ""}>Comunicazioni</span>
              </Button>
            </Link>

            {/* Only render dashboard link for admin users */}
            {showDashboard && (
              <Link to="/dashboard">
                <Button
                  variant={isActive("/dashboard") ? "default" : "ghost"}
                  size={isMobile ? "mobileNav" : "sm"}
                  className={`flex ${isMobile ? 'flex-col h-auto w-full' : 'items-center'}`}
                >
                  <Users className={isMobile ? "h-4 w-4 mb-1" : "mr-2 h-4 w-4"} />
                  <span className={isMobile ? "text-[10px] leading-tight" : ""}>Dashboard</span>
                </Button>
              </Link>
            )}
            
            {/* Show profile link for regular users */}
            {showProfile && (
              <Link to="/profile">
                <Button
                  variant={isActive("/profile") ? "default" : "ghost"}
                  size={isMobile ? "mobileNav" : "sm"}
                  className={`flex ${isMobile ? 'flex-col h-auto w-full' : 'items-center'}`}
                >
                  <User className={isMobile ? "h-4 w-4 mb-1" : "mr-2 h-4 w-4"} />
                  <span className={isMobile ? "text-[10px] leading-tight" : ""}>Profilo</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
