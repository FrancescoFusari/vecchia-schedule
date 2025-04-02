
import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./components/ui/theme-provider";
import { Layout } from "./components/Layout";
import Calendar from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Templates from "./pages/Templates";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import PWAInstall from "@/components/PWA/PWAInstall";
import { registerServiceWorker } from "@/utils/pwaUtils";

import Communications from "./pages/Communications";
import Orders from "./pages/Orders";
import TableOrders from "./pages/TableOrders";
import Index from "./pages/Index";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Register service worker with error handling
    const registerPWA = async () => {
      try {
        console.log("Registering service worker...");
        registerServiceWorker();
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };
    
    registerPWA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" storageKey="la-vecchia-signora-theme">
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/communications" element={<Communications />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/tables/:tableId" element={<TableOrders />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </AuthProvider>
        </Router>
        <PWAInstall />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
