
import { useState } from 'react';
import { OrderWithItems, RestaurantTable } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { PrintService } from '@/lib/print-service';
import { toast } from '@/hooks/use-toast';

interface PrintOrderButtonProps {
  order: OrderWithItems;
  table: RestaurantTable;
  disabled?: boolean;
}

export function PrintOrderButton({ order, table, disabled = false }: PrintOrderButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      
      // Generate PDF
      const doc = PrintService.generateOrderPDF(order, table);
      
      // Open PDF in a new window
      const pdfData = doc.output('datauristring');
      const printWindow = window.open(pdfData);
      
      if (!printWindow) {
        toast({
          title: "Attenzione",
          description: "Popup bloccati. Per favore, abilita i popup per questa pagina.",
          variant: "destructive"
        });
        return;
      }
      
      // Print automatically when the PDF is loaded
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing (most browsers will prompt before closing)
          // printWindow.close();
        }, 500);
      };
      
      toast({
        title: "Stampa",
        description: "Documento di stampa pronto"
      });
    } catch (error) {
      console.error("Error generating print document:", error);
      toast({
        title: "Errore",
        description: "Impossibile generare il documento per la stampa",
        variant: "destructive"
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handlePrint} 
      disabled={disabled || isPrinting}
      className="flex items-center gap-1"
    >
      <Printer className="h-4 w-4" />
      {isPrinting ? "Preparazione..." : "Stampa"}
    </Button>
  );
}
