
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Users, LogOut } from "lucide-react";

export function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  
  if (!user) return null;
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">WorkShift</span>
          </Link>
          
          <nav className="ml-10 hidden md:flex space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive("/")
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              Calendario
            </Link>
            
            {isAdmin() && (
              <Link
                to="/employees"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive("/employees")
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:text-primary"
                }`}
              >
                Dipendenti
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-gray-700">
            {user.firstName} {user.lastName}
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
              {user.role === "admin" ? "Admin" : "Dipendente"}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut()}
            className="rounded-full"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="md:hidden bg-white border-t border-gray-200">
        <div className="container grid grid-cols-2 gap-1 p-2">
          <Link
            to="/"
            className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/")
                ? "bg-primary/10 text-primary"
                : "text-gray-700 hover:text-primary"
            }`}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendario
          </Link>
          
          {isAdmin() && (
            <Link
              to="/employees"
              className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive("/employees")
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Dipendenti
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
