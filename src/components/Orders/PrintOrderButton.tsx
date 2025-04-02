
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
      
      // Generate PDF optimized for thermal receipt printer
      const doc = PrintService.generateOrderPDF(order, table);
      
      // Use blob approach for better printing compatibility
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      // Open PDF in a new window with specific settings for receipt printing
      const printWindow = window.open(url, '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        toast({
          title: "Attenzione",
          description: "Popup bloccati. Per favore, abilita i popup per questa pagina.",
          variant: "destructive"
        });
        return;
      }
      
      // Add custom print CSS to the new window
      printWindow.document.write(`
        <html>
          <head>
            <title>Stampa Ordine #${order.id.slice(-4)}</title>
            <style>
              @page {
                margin: 0;
                size: 80mm auto;  /* Width 80mm, height auto */
              }
              body {
                margin: 0;
                padding: 0;
              }
              img {
                width: 100%;
                height: auto;
              }
            </style>
          </head>
          <body>
            <img src="${url}" />
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
      
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
