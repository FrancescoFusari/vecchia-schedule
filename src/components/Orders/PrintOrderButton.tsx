
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
      console.log("Starting print process for order:", order.id);
      
      // Generate PDF directly using the data URL approach rather than blob
      const doc = PrintService.generateOrderPDF(order, table);
      
      // Use data URL approach which is more reliable for PDFs
      const dataUrl = doc.output('dataurlstring');
      console.log("PDF generated successfully, data URL length:", dataUrl.length);
      
      // Create a dedicated print window with simplified content
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        toast({
          title: "Attenzione",
          description: "Popup bloccati. Per favore, abilita i popup per questa pagina.",
          variant: "destructive"
        });
        return;
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Stampa Ordine - Tavolo ${table.tableNumber}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                margin: 0;
                padding: 0;
                background-color: white;
              }
              iframe {
                width: 100%;
                height: 100vh;
                border: 0;
                display: block;
              }
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
                body {
                  width: 80mm;
                }
                iframe {
                  display: none;
                }
                #printContent {
                  display: block !important;
                }
              }
              #printContent {
                display: none;
                width: 80mm;
                margin: 0 auto;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
              }
              .header {
                text-align: center;
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 10px;
              }
              .info {
                margin-bottom: 10px;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 8px 0;
              }
              .item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
              }
              .qty {
                width: 30px;
              }
              .name {
                flex: 1;
              }
              .price {
                width: 60px;
                text-align: right;
              }
              .total {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                margin-top: 10px;
              }
              .footer {
                text-align: center;
                margin-top: 15px;
                font-size: 10px;
              }
            </style>
          </head>
          <body>
            <iframe src="${dataUrl}"></iframe>
            
            <!-- Fallback content for direct printing if PDF fails -->
            <div id="printContent">
              <div class="header">LA VECCHIA SIGNORA</div>
              <div class="info">Tavolo: ${table.tableNumber}</div>
              <div class="info">Data: ${new Date(order.createdAt).toLocaleDateString('it-IT')} ${new Date(order.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
              <div class="divider"></div>
              
              <!-- Order Items -->
              ${order.items.map(item => `
                <div class="item">
                  <div class="qty">${item.quantity}x</div>
                  <div class="name">${item.menuItem.name}</div>
                  <div class="price">€${(item.quantity * item.menuItem.price).toFixed(2)}</div>
                </div>
                ${item.notes ? `<div style="margin-left: 30px; font-size: 10px;">Note: ${item.notes}</div>` : ''}
              `).join('')}
              
              <!-- Water and Bread if present -->
              ${(order.stillWater > 0 || order.sparklingWater > 0 || order.bread > 0) ? `
                <div class="divider"></div>
                <div style="font-weight: bold;">EXTRA</div>
                ${order.stillWater > 0 ? `<div class="item"><div class="qty">${order.stillWater}x</div><div class="name">Acqua Naturale</div></div>` : ''}
                ${order.sparklingWater > 0 ? `<div class="item"><div class="qty">${order.sparklingWater}x</div><div class="name">Acqua Frizzante</div></div>` : ''}
                ${order.bread > 0 ? `<div class="item"><div class="qty">${order.bread}x</div><div class="name">Pane</div></div>` : ''}
              ` : ''}
              
              <div class="divider"></div>
              <div class="total">
                <div>TOTALE:</div>
                <div>€${order.items.reduce((total, item) => total + (item.quantity * item.menuItem.price), 0).toFixed(2)}</div>
              </div>
              <div class="footer">Grazie per la Sua visita!</div>
            </div>
            
            <script>
              // Log the print process
              console.log("Print window loaded for order ID: ${order.id}");
              
              // Get the iframe element
              const iframe = document.querySelector('iframe');
              
              // Setup print on iframe load or fallback to the HTML version
              iframe.onload = function() {
                console.log("PDF iframe loaded");
                setTimeout(() => {
                  try {
                    console.log("Attempting to print...");
                    window.print();
                  } catch(e) {
                    console.error("Print failed:", e);
                    // If iframe print fails, show the HTML version
                    document.getElementById('printContent').style.display = 'block';
                    iframe.style.display = 'none';
                    setTimeout(() => window.print(), 500);
                  }
                }, 1000);
              };
              
              // Fallback if iframe doesn't trigger onload
              setTimeout(() => {
                if (!iframe.contentDocument || iframe.contentDocument.body.innerHTML === '') {
                  console.log("Iframe load timeout - switching to HTML fallback");
                  document.getElementById('printContent').style.display = 'block';
                  iframe.style.display = 'none';
                  setTimeout(() => window.print(), 500);
                }
              }, 3000);
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
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
