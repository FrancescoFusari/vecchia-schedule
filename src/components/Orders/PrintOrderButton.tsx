
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
  onPrintGenerated?: (pdfDataUrl: string) => void;
}

export function PrintOrderButton({ 
  order, 
  table, 
  disabled = false, 
  onPrintGenerated 
}: PrintOrderButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      console.log("Starting print process for order:", order.id);
      
      // Generate PDF directly using the data URL approach
      const doc = PrintService.generateOrderPDF(order, table);
      
      // Convert to blob URL for more reliable rendering
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      console.log("PDF generated successfully as blob URL");
      
      // Send the blob URL to the parent component
      if (onPrintGenerated) {
        onPrintGenerated(blobUrl);
      }
      
      toast({
        title: "Documento generato",
        description: "Il documento è stato generato con successo"
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
