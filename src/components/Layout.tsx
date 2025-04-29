
import { Navbar } from "./Navbar";
import { Toaster } from "@/components/ui/toaster";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { OfflineIndicator } from "./OfflineIndicator";

export function Layout() {
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  
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
      <main className={`flex-1 container mx-auto px-4 ${isMobile ? 'pt-6 pb-28' : 'pt-24 pb-6'} sm:px-6 md:px-8`}>
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
