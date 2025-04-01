
import { Navbar } from "./Navbar";
import { Toaster } from "@/components/ui/toaster";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export function Layout() {
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  
  // Initialize the theme to dark on first load, but don't force it afterwards
  useEffect(() => {
    if (!theme) {
      setTheme('dark');
    }
  }, [setTheme, theme]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <Navbar />
      <main className={`flex-1 container mx-auto px-4 py-6 sm:px-6 md:px-8 ${isMobile ? 'pb-24' : ''}`}>
        <Outlet />
      </main>
      <footer className={`border-t border-border bg-card py-4 ${isMobile ? 'pb-20' : ''} transition-colors duration-300`}>
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} La Vecchia Signora - Pizzeria - Trattoria - Forno a Legna
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
