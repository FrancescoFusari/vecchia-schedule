
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, User, LogOut, Clock } from "lucide-react";
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
    <div className={`z-50 fixed ${isMobile ? 'top-0 left-0 right-0 px-4 pt-4' : 'top-0 left-0 right-0 px-4 py-2'}`}>
      <nav className={`glassmorphic rounded-2xl mx-auto max-w-screen-xl ${isMobile ? 'py-5 px-4' : 'py-3 px-4'} transition-all duration-300 shadow-lg border border-border/40`}>
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
                label="Calendario"
                isActive={isActive("/")}
                showLabel={false}
              />
              
              <MobileNavButton
                to="/hours-summary"
                icon={<Clock className="h-6 w-6" />}
                label="Ore"
                isActive={isActive("/hours-summary")}
                showLabel={false}
              />
              
              {showDashboard && (
                <MobileNavButton
                  to="/dashboard"
                  icon={<Users className="h-6 w-6" />}
                  label="Gestione"
                  isActive={isActive("/dashboard")}
                  showLabel={false}
                />
              )}
              
              <MobileNavButton
                to="/profile"
                icon={<User className="h-6 w-6" />}
                label="Profilo"
                isActive={isActive("/profile")}
                showLabel={false}
              />
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              {/* Main navigation links for desktop */}
              <Link to="/">
                <Button 
                  variant={isActive("/") ? "default" : "ghost"} 
                  className={`${isActive("/") ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'hover:bg-background/20'} rounded-xl transition-all px-4 py-2 h-auto`}
                >
                  <CalendarDays className="h-5 w-5 mr-2" />
                  <span>Calendario</span>
                </Button>
              </Link>

              {/* Hours Summary link for all users */}
              <Link to="/hours-summary">
                <Button 
                  variant={isActive("/hours-summary") ? "default" : "ghost"} 
                  className={`${isActive("/hours-summary") ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'hover:bg-background/20'} rounded-xl transition-all px-4 py-2 h-auto`}
                >
                  <Clock className="h-5 w-5 mr-2" />
                  <span>Ore</span>
                </Button>
              </Link>
              
              {/* Only render dashboard link for admin users */}
              {showDashboard && (
                <Link to="/dashboard">
                  <Button 
                    variant={isActive("/dashboard") ? "default" : "ghost"} 
                    className={`${isActive("/dashboard") ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'hover:bg-background/20'} rounded-xl transition-all px-4 py-2 h-auto`}
                  >
                    <Users className="h-5 w-5 mr-2" />
                    <span>Gestione</span>
                  </Button>
                </Link>
              )}
              
              {/* Show profile link for regular users */}
              <Link to="/profile">
                <Button 
                  variant={isActive("/profile") ? "default" : "ghost"} 
                  className={`${isActive("/profile") ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'hover:bg-background/20'} rounded-xl transition-all px-4 py-2 h-auto`}
                >
                  <User className="h-5 w-5 mr-2" />
                  <span>Profilo</span>
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                onClick={handleLogout} 
                aria-label="Logout"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl px-4 py-2 h-auto"
              >
                <LogOut className="h-5 w-5 mr-2" />
                <span>Esci</span>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
