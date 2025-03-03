
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4 animate-fade-in">
        <div className="bg-primary/10 rounded-full p-6 inline-flex mb-6">
          <img 
            src="/lovable-uploads/5cec7ef1-53d9-4fab-ba62-9a1137e84da9.png" 
            alt="La Vecchia Signora" 
            className="h-16 w-16" 
          />
        </div>
        <h1 className="text-6xl font-bold mb-4 text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          Pagina non trovata
        </p>
        <p className="text-gray-500 mb-8">
          Non siamo riusciti a trovare la pagina che stai cercando.
          {location.pathname && (
            <span className="block mt-2 text-sm font-mono bg-gray-100 p-2 rounded">
              {location.pathname}
            </span>
          )}
        </p>
        <Button
          onClick={() => navigate("/")}
          className="inline-flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
