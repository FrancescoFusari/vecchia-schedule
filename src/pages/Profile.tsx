
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Employee } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: employeeData, isLoading } = useQuery({
    queryKey: ['employee', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching employee data:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati del dipendente.",
          variant: "destructive",
        });
        return null;
      }
      
      if (!data) return null;
      
      // Convert DB column names to our Employee type
      const employee: Employee = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        username: data.username || data.first_name.toLowerCase(),
        phone: data.phone,
        position: data.position,
        color: data.color,
        userId: data.user_id,
        createdAt: data.created_at,
      };
      
      return employee;
    },
    enabled: !!user,
  });

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
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
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
        
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-24">
                <p className="text-gray-500">Caricamento dati dipendente...</p>
              </div>
            </CardContent>
          </Card>
        ) : employeeData ? (
          <Card>
            <CardHeader>
              <CardTitle>
                Informazioni Dipendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Posizione</p>
                  <p className="font-medium">{employeeData.position || 'Non specificata'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefono</p>
                  <p className="font-medium">{employeeData.phone || 'Non specificato'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">Colore assegnato:</p>
                  {employeeData.color && (
                    <div 
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: employeeData.color }}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-24">
                <p className="text-gray-500">
                  Il tuo account non è collegato a nessun profilo dipendente.
                  Contatta l'amministratore per ulteriori informazioni.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
