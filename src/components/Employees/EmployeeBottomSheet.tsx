
import { useState } from "react";
import { Employee } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarPlus, Users } from "lucide-react";

interface EmployeeBottomSheetProps {
  employees: Employee[];
  onEmployeeSelect: (employee: Employee) => void;
  buttonVariant?: "default" | "outline" | "ghost";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  isAdmin: boolean;
}

export function EmployeeBottomSheet({
  employees,
  onEmployeeSelect,
  buttonVariant = "default",
  buttonSize = "default",
  isAdmin
}: EmployeeBottomSheetProps) {
  const [open, setOpen] = useState(false);
  
  const handleEmployeeClick = (employee: Employee) => {
    onEmployeeSelect(employee);
    setOpen(false);
  };
  
  if (!isAdmin || employees.length === 0) return null;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default"
          size="lg"
          className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all gap-2"
        >
          <Users className="h-5 w-5" />
          Assegna turni
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Seleziona dipendente</DialogTitle>
          <DialogDescription>
            Seleziona un dipendente per assegnare turni
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] sm:h-[50vh] px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-6">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleEmployeeClick(employee)}
              >
                <Avatar 
                  className="h-16 w-16 mb-3" 
                  style={{ backgroundColor: employee.color }}
                >
                  <span className="text-xl font-medium text-white">
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                  </span>
                </Avatar>
                <div className="text-center">
                  <h3 className="font-medium leading-none mb-1">
                    {employee.firstName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {employee.lastName}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="mt-3 gap-1 bg-primary/5 hover:bg-primary/10 text-primary"
                >
                  <CalendarPlus className="h-3 w-3" />
                  <span className="text-xs">Assegna</span>
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="w-full"
          >
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
