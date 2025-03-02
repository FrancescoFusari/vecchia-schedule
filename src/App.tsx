
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Calendar from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children, adminOnly = false }: { children: JSX.Element, adminOnly?: boolean }) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) {
    // Show loading state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Caricamento...</div>
      </div>
    );
  }
  
  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdmin()) {
    // Redirect to dashboard if not admin
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Calendar />} />
              <Route 
                path="dashboard" 
                element={
                  <ProtectedRoute adminOnly>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="profile" element={<Profile />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
