
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageList } from "@/components/Communications/MessageList";
import { NewMessageForm } from "@/components/Communications/NewMessageForm";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Communications() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("view");

  useEffect(() => {
    // Redirect to home if not logged in
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Comunicazioni</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isAdmin() ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="view">Visualizza messaggi</TabsTrigger>
                <TabsTrigger value="create">Nuovo messaggio</TabsTrigger>
              </TabsList>
              <TabsContent value="view" className="mt-4">
                <MessageList isAdmin={true} />
              </TabsContent>
              <TabsContent value="create" className="mt-4">
                <NewMessageForm onSuccess={() => setActiveTab("view")} />
              </TabsContent>
            </Tabs>
          ) : (
            <MessageList isAdmin={false} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
