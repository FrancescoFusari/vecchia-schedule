
import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Profilo</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Informazioni Personali</h2>
          <div className="space-y-4 mb-8">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">{user?.firstName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cognome</p>
              <p className="font-medium">{user?.lastName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Username</p>
              <p className="font-medium">{user?.username || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user?.email || 'N/A'}</p>
            </div>
          </div>
          
          <Button 
            variant="destructive" 
            className="w-full sm:w-auto flex items-center" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
