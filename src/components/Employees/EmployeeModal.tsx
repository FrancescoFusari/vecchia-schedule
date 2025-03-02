
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
}

export function EmployeeModal({ isOpen, onClose, employee, onSave, onDelete }: EmployeeModalProps) {
  const [firstName, setFirstName] = useState(employee?.firstName || "");
  const [lastName, setLastName] = useState(employee?.lastName || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [username, setUsername] = useState(employee?.username || "");
  const [phone, setPhone] = useState(employee?.phone || "");
  const [position, setPosition] = useState(employee?.position || "");
  
  const handleSave = () => {
    if (!firstName || !lastName || !email || !username) {
      // Show validation error
      return;
    }
    
    const updatedEmployee: Employee = {
      id: employee?.id || generateId(),
      firstName,
      lastName,
      email,
      username,
      phone,
      position,
      createdAt: employee?.createdAt || new Date().toISOString(),
    };
    
    onSave(updatedEmployee);
  };
  
  const handleDelete = () => {
    if (employee) {
      onDelete(employee.id);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Modifica dipendente" : "Aggiungi dipendente"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              Nome
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Cognome
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
            />
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
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          {employee && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Elimina</Button>
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
            <Button variant="outline" onClick={onClose} className="mr-2">
              Annulla
            </Button>
            <Button onClick={handleSave}>Salva</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
