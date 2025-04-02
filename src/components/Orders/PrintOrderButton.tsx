
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
      
      // Generate PDF optimized for thermal printer
      const doc = PrintService.generateOrderPDF(order, table);
      
      // Use blob approach for better compatibility
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      // Open PDF in a new window with specific dimensions for thermal receipt
      const printWindow = window.open(
        url, 
        '_blank',
        'width=800,height=600,menubar=no,toolbar=no,location=no'
      );
      
      if (!printWindow) {
        toast({
          title: "Attenzione",
          description: "Popup bloccati. Per favore, abilita i popup per questa pagina.",
          variant: "destructive"
        });
        return;
      }
      
      // Add special styling for the print window with improved visibility settings
      printWindow.document.write(`
        <html>
          <head>
            <title>Stampa Ordine - Tavolo ${table.tableNumber}</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                background-color: #f0f0f0;
              }
              
              iframe {
                width: 100%;
                height: 100vh;
                border: none;
                background-color: white;
              }
              
              @media print {
                @page {
                  size: 80mm auto;  /* Width of thermal paper */
                  margin: 0;
                }
                body {
                  width: 80mm;
                  background-color: white;
                }
                iframe {
                  width: 100%;
                  height: auto;
                }
              }
            </style>
          </head>
          <body>
            <iframe src="${url}" style="width:100%; height:100vh; border:none;"></iframe>
            <script>
              // Add print trigger on iframe load
              document.querySelector('iframe').onload = function() {
                setTimeout(function() {
                  window.focus();
                  // Optional: window.print();
                  // We'll let user decide when to print
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      
      // Clean up the blob URL when done
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
