
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "next-themes";
import { ExperimentalNavMenu } from "@/components/Navbar/ExperimentalNavMenu";
import { HoursSummaryNavButton } from "@/components/Navbar/HoursSummaryNavButton";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  if (!user) return null;

  // Only show dashboard for admin users
  const showDashboard = isAdmin();
  
  // Show profile for regular users
  const showProfile = !showDashboard;

  const handleLogout = () => {
    signOut();
  };

  return (
    <nav className={`bg-card shadow-sm ${isMobile ? 'fixed bottom-0 left-0 right-0 z-50 border-t' : 'border-b'} border-border transition-colors duration-300`}>
      <div className={`container mx-auto ${isMobile ? 'px-2 py-2' : 'px-4 py-3'}`}>
        <div className="flex justify-between items-center">
          {!isMobile && (
            <div className="flex space-x-1">
              <Link to="/" className="flex items-center text-lg font-semibold text-foreground">
                <img 
                  src="/lovable-uploads/5cec7ef1-53d9-4fab-ba62-9a1137e84da9.png" 
                  alt="La Vecchia Signora" 
                  className={`h-8 mr-2 ${isDarkTheme ? 'invert' : ''}`} 
                />
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

            {/* Hours Summary link for all users */}
            <HoursSummaryNavButton isMobile={isMobile} />

            {/* Experimental dropdown menu */}
            <ExperimentalNavMenu isMobile={isMobile} />
            
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
            
            {/* Add theme toggle button */}
            {!isMobile && (
              <ThemeToggle className="ml-2" />
            )}
            
            {/* Add logout button if not on mobile */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center text-destructive hover:bg-destructive/10 hover:text-destructive ml-2"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
