
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setLoginError('Username and password are required');
      return;
    }
    
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      
      // Log login attempt without exposing password
      console.log("Login attempt with username:", username);
      
      await signIn(username, password);
      // Redirect will happen automatically due to the useEffect above
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Provide a more detailed error message based on the error
      let errorMessage = 'Invalid credentials. Please try again.';
      
      if (error.message && error.message.includes('Database error')) {
        errorMessage = 'Database error. Please try again or contact support.';
      } else if (error.message && error.message.includes('Invalid login')) {
        errorMessage = 'Invalid username or password. Please check your credentials.';
      }
      
      setLoginError(errorMessage);
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Work Shift</CardTitle>
          <CardDescription className="text-center">
            Inserisci le tue credenziali per accedere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="admin o username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {loginError && (
              <div className="text-sm font-medium text-destructive">
                {loginError}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">Credenziali di demo:</p>
            <p className="font-medium">Username: <span className="font-bold">admin</span></p>
            <p className="font-medium">Password: <span className="font-bold">juventus96</span></p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-xs text-center text-muted-foreground">
            Questa è un'applicazione di gestione turni. Se non hai un account, contatta l'amministratore.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
