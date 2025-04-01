import { useState, useEffect } from "react";
import { getSections } from "@/lib/restaurant-service";
import { RestaurantSection } from "@/lib/types";
import { SectionCard } from "@/components/Orders/SectionCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
const Orders = () => {
  const [sections, setSections] = useState<RestaurantSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const {
    user,
    isAdmin
  } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (isAdmin()) {
      // Optionally redirect admins to dashboard or another page
      // navigate('/dashboard');
    }
  }, [user, isAdmin, navigate]);
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setIsLoading(true);
        const sectionsData = await getSections();
        setSections(sectionsData);
      } catch (error) {
        console.error("Error fetching sections:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare le sezioni del ristorante",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (user) {
      fetchSections();
    }
  }, [user]);
  if (!user) {
    return null; // Will redirect to login
  }
  return <div className="container mx-auto  py-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestione Comande</h1>
        
        {isAdmin() && <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Amministrazione
          </Button>}
      </div>

      {isLoading ? <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div> : sections.length === 0 ? <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nessuna sezione del ristorante configurata
          </p>
          {isAdmin() && <Button onClick={() => navigate('/dashboard')}>
              Configura il ristorante
            </Button>}
        </div> : <div className="space-y-6">
          {sections.map(section => <SectionCard key={section.id} section={section} />)}
        </div>}
    </div>;
};
export default Orders;