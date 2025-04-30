
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, User, LogOut, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNavButton } from "@/components/Navbar/MobileNavButton";

export function Navbar() {
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  if (!user) return null;

  // Only show dashboard for admin users
  const showDashboard = isAdmin();
  
  const handleLogout = () => {
    signOut();
  };
  
  return (
    <div className={`z-50 ${isMobile ? 'fixed bottom-0 left-0 right-0 px-2 pb-6 pt-2' : 'sticky top-0 left-0 right-0 px-4 py-1'}`}>
      <nav className={`glassmorphic rounded-[2rem] mx-auto max-w-screen-xl ${isMobile ? 'py-5 px-4' : 'py-2 px-4'} transition-all duration-300 shadow-md border border-border/30`}>
        <div className="flex justify-between items-center">
          {!isMobile && <div className="flex space-x-1">
              <Link to="/" className="flex items-center text-lg font-semibold text-foreground">
                <img src="/lovable-uploads/5cec7ef1-53d9-4fab-ba62-9a1137e84da9.png" alt="La Vecchia Signora" className="h-8 mr-2 invert" />
                <span>La Vecchia Signora</span>
              </Link>
            </div>}

          {isMobile ? (
            <div className="flex w-full justify-between">
              <MobileNavButton
                to="/"
                icon={<CalendarDays className="h-6 w-6" />}
                isActive={isActive("/")}
              />
              
              <MobileNavButton
                to="/hours-summary"
                icon={<Clock className="h-6 w-6" />}
                isActive={isActive("/hours-summary")}
              />
              
              {showDashboard && (
                <MobileNavButton
                  to="/dashboard"
                  icon={<Users className="h-6 w-6" />}
                  isActive={isActive("/dashboard")}
                />
              )}
              
              <MobileNavButton
                to="/profile"
                icon={<User className="h-6 w-6" />}
                isActive={isActive("/profile")}
              />
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              {/* Main navigation links for desktop */}
              <Link to="/">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  aria-label="Calendario"
                  className={`${isActive("/") ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} rounded-full transition-all`}
                >
                  <CalendarDays className="h-5 w-5" />
                </Button>
              </Link>

              {/* Hours Summary link for all users */}
              <Link to="/hours-summary">
                <Button 
                  variant="ghost" 
                  size="icon"
                  aria-label="Riepilogo Ore" 
                  className={`${isActive("/hours-summary") ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} rounded-full transition-all`}
                >
                  <Clock className="h-5 w-5" />
                </Button>
              </Link>
              
              {/* Only render dashboard link for admin users */}
              {showDashboard && (
                <Link to="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    aria-label="Dashboard" 
                    className={`${isActive("/dashboard") ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} rounded-full transition-all`}
                  >
                    <Users className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              
              {/* Show profile link for regular users */}
              <Link to="/profile">
                <Button 
                  variant="ghost" 
                  size="icon"
                  aria-label="Profilo" 
                  className={`${isActive("/profile") ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} rounded-full transition-all`}
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                aria-label="Logout"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
