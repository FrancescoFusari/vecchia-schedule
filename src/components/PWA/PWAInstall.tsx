
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
    'appinstalled': Event;
  }
}

const PWAInstall: React.FC = () => {
  const { toast } = useToast();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      toast({
        title: "App installata!",
        description: "L'app è stata installata con successo sul tuo dispositivo.",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show the installation prompt
    await installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the saved prompt since it can't be used again
    setInstallPrompt(null);
  };

  const showIOSInstructions = () => {
    toast({
      title: "Installazione su iOS",
      description: "Per installare l'app: tocca l'icona di condivisione, poi 'Aggiungi a schermata Home'.",
      duration: 5000,
    });
  };

  if (isInstalled) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {installPrompt && (
        <Button 
          onClick={handleInstallClick} 
          className="flex items-center gap-2 shadow-lg"
        >
          <Download className="h-4 w-4" />
          Installa App
        </Button>
      )}
      
      {isIOS && !installPrompt && (
        <Button 
          onClick={showIOSInstructions} 
          className="flex items-center gap-2 shadow-lg"
        >
          <Download className="h-4 w-4" />
          Installa App
        </Button>
      )}
    </div>
  );
};

export default PWAInstall;
