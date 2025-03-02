
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, LogOut, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            <Link to="/" className="flex items-center text-lg font-semibold text-primary">
              <CalendarDays className="mr-2 h-6 w-6" />
              WorkShift
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {/* Main navigation links */}
            <Link to="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                className="flex items-center"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Calendario
              </Button>
            </Link>

            {isAdmin() && (
              <>
                <Link to="/employees">
                  <Button
                    variant={isActive("/employees") ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Dipendenti
                  </Button>
                </Link>
                
                <Link to="/templates">
                  <Button
                    variant={isActive("/templates") ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Template
                  </Button>
                </Link>
              </>
            )}

            {/* Logout button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center text-destructive"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
