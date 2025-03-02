import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";

const EMPLOYEE_COLORS = [
  { value: "#F97316", label: "Arancione" },
  { value: "#8B5CF6", label: "Viola" },
  { value: "#0EA5E9", label: "Blu" },
  { value: "#D946EF", label: "Rosa" },
  { value: "#10B981", label: "Verde" },
  { value: "#F43F5E", label: "Rosso" },
  { value: "#FBBF24", label: "Giallo" },
  { value: "#6366F1", label: "Indaco" },
  { value: "#14B8A6", label: "Turchese" },
  { value: "#9CA3AF", label: "Grigio" }
];

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
}

interface RegisteredUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export function EmployeeModal({ isOpen, onClose, employee, onSave, onDelete }: EmployeeModalProps) {
  const [firstName, setFirstName] = useState(employee?.firstName || "");
  const [lastName, setLastName] = useState(employee?.lastName || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [username, setUsername] = useState(employee?.username || "");
  const [phone, setPhone] = useState(employee?.phone || "");
  const [position, setPosition] = useState(employee?.position || "");
  const [color, setColor] = useState(employee?.color || EMPLOYEE_COLORS[0].value);
  const [userId, setUserId] = useState(employee?.userId || "");
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchRegisteredUsers();
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (employee) {
      setFirstName(employee.firstName);
      setLastName(employee.lastName);
      setEmail(employee.email || "");
      setUsername(employee.username);
      setPhone(employee.phone || "");
      setPosition(employee.position || "");
      setColor(employee.color || EMPLOYEE_COLORS[0].value);
      setUserId(employee.userId || "");
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setUsername("");
      setPhone("");
      setPosition("");
      setColor(EMPLOYEE_COLORS[0].value);
      setUserId("");
    }
    setErrors({});
    setErrorMessage(null);
  }, [employee]);
  
  const fetchRegisteredUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const adminSession = localStorage.getItem('workshift_admin_session');
      if (!adminSession) {
        toast({
          title: "Accesso negato",
          description: "Solo gli amministratori possono vedere gli utenti registrati.",
          variant: "destructive",
        });
        setIsLoadingUsers(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, email')
        .order('first_name', { ascending: true });
      
      if (error) {
        console.error("Error fetching registered users:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare gli utenti registrati.",
          variant: "destructive",
        });
      } else if (data) {
        const users: RegisteredUser[] = data.map(user => ({
          id: user.id,
          username: user.username || user.first_name.toLowerCase(),
          firstName: user.first_name,
          lastName: user.last_name || "",
          email: user.email
        }));
        setRegisteredUsers(users);
      }
    } catch (error) {
      console.error("Error fetching registered users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = "Il nome è obbligatorio";
    }
    
    if (email && email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Inserisci un indirizzo email valido";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    setErrorMessage(null);
    
    if (!validateForm()) {
      toast({
        title: "Errore di validazione",
        description: "Controlla i campi evidenziati e riprova.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const adminSession = localStorage.getItem('workshift_admin_session');
      if (!adminSession) {
        toast({
          title: "Accesso negato",
          description: "Solo gli amministratori possono gestire i dipendenti.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        setErrorMessage("Solo gli amministratori possono gestire i dipendenti.");
        return;
      }
      
      const updatedEmployee: Employee = {
        id: employee?.id || generateId(),
        firstName: firstName.trim(),
        lastName: lastName.trim() || "",
        email: email.trim() || null,
        username: username.trim() || firstName.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        position: position.trim() || undefined,
        color: color,
        userId: userId || undefined,
        createdAt: employee?.createdAt || new Date().toISOString(),
      };
      
      await onSave(updatedEmployee);
      toast({
        title: "Salvato",
        description: employee ? "Dipendente aggiornato con successo." : "Nuovo dipendente aggiunto con successo.",
      });
    } catch (error) {
      console.error("Error saving employee:", error);
      let message = "Si è verificato un errore durante il salvataggio. Riprova.";
      
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error !== null) {
        message = (error as any).message || message;
      }
      
      setErrorMessage(message);
      
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = () => {
    if (employee) {
      onDelete(employee.id);
    }
  };
  
  const handleUserChange = (selectedUserId: string) => {
    setUserId(selectedUserId);
    
    if (selectedUserId) {
      const selectedUser = registeredUsers.find(user => user.id === selectedUserId);
      if (selectedUser) {
        setFirstName(selectedUser.firstName);
        setLastName(selectedUser.lastName || "");
        setEmail(selectedUser.email || "");
        setUsername(selectedUser.username);
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Modifica dipendente" : "Aggiungi dipendente"}
          </DialogTitle>
        </DialogHeader>
        
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user" className="text-right">
              Utente
            </Label>
            <div className="col-span-3">
              <Select value={userId} onValueChange={handleUserChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleziona un utente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-user">Nessun utente (solo dipendente)</SelectItem>
                  {isLoadingUsers ? (
                    <SelectItem value="loading" disabled>Caricamento utenti...</SelectItem>
                  ) : (
                    registeredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.username})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Collega il dipendente a un utente registrato per permettergli di accedere alla propria dashboard.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              Nome <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3">
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={errors.firstName ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Cognome
            </Label>
            <div className="col-span-3">
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={errors.lastName ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Colore
            </Label>
            <div className="col-span-3">
              <div className="grid grid-cols-5 gap-2">
                {EMPLOYEE_COLORS.map((colorOption) => (
                  <div
                    key={colorOption.value}
                    className={`w-8 h-8 rounded-full cursor-pointer border-2 ${color === colorOption.value ? 'border-black' : 'border-transparent'}`}
                    style={{ backgroundColor: colorOption.value }}
                    onClick={() => setColor(colorOption.value)}
                    title={colorOption.label}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <div className="col-span-3">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={errors.username ? "border-red-500" : ""}
                disabled={isSubmitting}
                placeholder={firstName ? firstName.toLowerCase() : ""}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
              {!username && firstName && (
                <p className="text-gray-500 text-sm mt-1">Verrà utilizzato "{firstName.toLowerCase()}" come username predefinito</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <div className="col-span-3">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Telefono
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              Posizione
            </Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          {employee && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isSubmitting}>Elimina</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione eliminerà definitivamente il dipendente e tutti i suoi turni. Non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <div>
            <Button variant="outline" onClick={onClose} className="mr-2" disabled={isSubmitting}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Salvataggio...
                </>
              ) : (
                "Salva"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
