
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Loader2, CheckCircle, Trash, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  title: string;
  content: string;
  created_at: string;
  sender_name: string;
  read_by: string[];
}

interface MessageListProps {
  isAdmin: boolean;
}

export function MessageList({ isAdmin }: MessageListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i messaggi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('public:communications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'communications' 
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (messageId: string) => {
    if (!user) return;
    
    try {
      const { data: message, error: fetchError } = await supabase
        .from('communications')
        .select('read_by')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      const readBy = message.read_by || [];
      
      // Check if user has already read this message
      if (readBy.includes(user.id)) return;
      
      // Add user to read_by array
      const updatedReadBy = [...readBy, user.id];
      
      const { error: updateError } = await supabase
        .from('communications')
        .update({ read_by: updatedReadBy })
        .eq('id', messageId);

      if (updateError) throw updateError;
      
      // Update local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, read_by: updatedReadBy } 
            : msg
        )
      );

      toast({
        title: "Messaggio letto",
        description: "Hai confermato la lettura del messaggio",
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast({
        title: "Errore",
        description: "Impossibile contrassegnare come letto",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('communications')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== messageId)
      );

      toast({
        title: "Messaggio eliminato",
        description: "Il messaggio è stato eliminato con successo",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il messaggio",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-muted/50">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">Non ci sono messaggi da visualizzare</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const hasRead = user && message.read_by?.includes(user.id);
        const readCount = message.read_by?.length || 0;
        const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
        
        return (
          <Card key={message.id} className={hasRead ? "border-muted" : "border-primary"}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{message.title}</CardTitle>
                  <CardDescription>
                    Da {message.sender_name} • {timeAgo}
                  </CardDescription>
                </div>
                {!hasRead && !isAdmin && (
                  <Badge variant="outline" className="ml-2">
                    Nuovo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{message.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                {isAdmin && (
                  <p className="text-sm text-muted-foreground">
                    Letto da {readCount} {readCount === 1 ? 'persona' : 'persone'}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                {!isAdmin && !hasRead && (
                  <Button 
                    variant="outline" 
                    onClick={() => markAsRead(message.id)}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Conferma lettura
                  </Button>
                )}
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        size="icon"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Questa azione non può essere annullata. Il messaggio verrà rimosso definitivamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMessage(message.id)}>
                          Elimina
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
