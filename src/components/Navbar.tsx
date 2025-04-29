
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "next-themes";
import { HoursSummaryNavButton } from "@/components/Navbar/HoursSummaryNavButton";

export function Navbar() {
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const {
    theme
  } = useTheme();
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
    <div className="z-50 fixed top-0 left-0 right-0 px-4 py-2">
      <nav className={`glassmorphic rounded-lg mx-auto max-w-screen-xl ${isMobile ? 'py-2 px-3' : 'py-3 px-4'} transition-all duration-300 shadow-lg`}>
        <div className="flex justify-between items-center">
          {!isMobile && <div className="flex space-x-1">
              <Link to="/" className="flex items-center text-lg font-semibold text-foreground">
                <img src="/lovable-uploads/5cec7ef1-53d9-4fab-ba62-9a1137e84da9.png" alt="La Vecchia Signora" className={`h-8 mr-2 ${isDarkTheme ? 'invert' : ''}`} />
                <span>La Vecchia Signora</span>
              </Link>
            </div>}

          <div className={`flex items-center ${isMobile ? 'w-full justify-around' : 'space-x-4'}`}>
            {/* Main navigation links */}
            <Link to="/">
              <Button 
                variant={isActive("/") ? "default" : "ghost"} 
                size="icon" 
                aria-label="Calendario"
                className={`${isActive("/") ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'hover:bg-background/20'} rounded-full transition-all`}
              >
                <CalendarDays className="h-5 w-5" />
              </Button>
            </Link>

            {/* Hours Summary link for all users */}
            <Link to="/hours-summary">
              <Button 
                variant={isActive("/hours-summary") ? "default" : "ghost"} 
                size="icon"
                aria-label="Riepilogo Ore" 
                className={`${isActive("/hours-summary") ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'hover:bg-background/20'} rounded-full transition-all`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </Button>
            </Link>
            
            {/* Only render dashboard link for admin users */}
            {showDashboard && (
              <Link to="/dashboard">
                <Button 
                  variant={isActive("/dashboard") ? "default" : "ghost"} 
                  size="icon"
                  aria-label="Dashboard" 
                  className={`${isActive("/dashboard") ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'hover:bg-background/20'} rounded-full transition-all`}
                >
                  <Users className="h-5 w-5" />
                </Button>
              </Link>
            )}
            
            {/* Show profile link for regular users */}
            <Link to="/profile">
              <Button 
                variant={isActive("/profile") ? "default" : "ghost"} 
                size="icon"
                aria-label="Profilo" 
                className={`${isActive("/profile") ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'hover:bg-background/20'} rounded-full transition-all`}
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
            
            {/* Theme toggle */}
            <ThemeToggle className="rounded-full" />
            
            {/* Add logout button if not on mobile */}
            {!isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                aria-label="Logout"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
