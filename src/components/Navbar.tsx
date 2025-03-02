
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon, Users, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white border-b py-2 px-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-1">
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendario
          </NavLink>

          {isAdmin() && (
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Users className="mr-2 h-4 w-4" />
              Dipendenti
            </NavLink>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">
            {user.firstName} {user.lastName}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut}
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
