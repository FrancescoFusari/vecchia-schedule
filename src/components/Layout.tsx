
import { Navbar } from "./Navbar";
import { Toaster } from "@/components/ui/toaster";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export function Layout() {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className={`flex-1 container mx-auto px-4 py-6 sm:px-6 md:px-8 ${isMobile ? 'pb-24' : ''}`}>
        <Outlet />
      </main>
      <footer className={`border-t border-gray-200 bg-white py-4 ${isMobile ? 'pb-20' : ''}`}>
        <div className="container text-center text-sm text-gray-500">
          © {new Date().getFullYear()} WorkShift - Gestione turni e orari
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
