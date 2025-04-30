
import { Navbar } from "./Navbar";
import { Toaster } from "@/components/ui/toaster";
import { Outlet, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { OfflineIndicator } from "./OfflineIndicator";

export function Layout() {
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  
  // Always initialize the theme to dark
  useEffect(() => {
    if (!theme) {
      setTheme('dark');
    }
  }, [setTheme, theme]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <OfflineIndicator />
      <Navbar />
      <main className={`flex-1 container mx-auto px-4 ${isMobile ? 'pt-2 pb-36' : 'pt-4 pb-6'} sm:px-6 md:px-8`}>
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
