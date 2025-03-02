
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <Calendar className="h-16 w-16 text-primary mb-4" />
          <h1 className="text-2xl font-bold">Caricamento...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <Calendar className="h-20 w-20 mx-auto text-primary mb-6" />
        <h1 className="text-4xl font-bold mb-4">WorkShift</h1>
        <p className="text-xl text-gray-600 mb-8">Gestione turni e orari</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate("/login")}>Accedi</Button>
          <Button variant="outline" onClick={() => navigate("/register")}>Registrati</Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
