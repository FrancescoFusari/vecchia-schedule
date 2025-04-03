
import { OrderWithItems, RestaurantTable } from './types';

export class PrintService {
  static generateOrderReceiptHTML(order: OrderWithItems, table: RestaurantTable): string {
    try {
      // Format date and time
      const orderDate = new Date(order.createdAt);
      const dateString = orderDate.toLocaleDateString('it-IT');
      const timeString = orderDate.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Calculate total
      let totalAmount = 0;
      order.items.forEach(item => {
        totalAmount += item.quantity * item.menuItem.price;
      });
      
      // Check for course separation
      const hasFirstCourse = order.items.some(item => !item.isLastFirstCourse);
      const hasSecondCourse = order.items.some(item => item.isLastFirstCourse) || 
                             order.items.findIndex(item => item.isLastFirstCourse) < order.items.length - 1;
      
      // Start building HTML
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ordine Tavolo ${table.tableNumber}</title>
          <style>
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              background-color: white;
              width: 80mm;
              margin: 0 auto;
            }
            .receipt {
              padding: 5mm;
            }
            .header {
              text-align: center;
              margin-bottom: 5mm;
            }
            .header h1 {
              font-size: 14pt;
              margin: 0;
              padding: 0;
            }
            .info {
              margin-bottom: 5mm;
              font-size: 10pt;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 3mm 0;
            }
            .item-header, .item {
              display: flex;
              justify-content: space-between;
              font-size: 10pt;
              margin-bottom: 2mm;
            }
            .item-header {
              font-weight: bold;
            }
            .qty {
              width: 10mm;
            }
            .name {
              flex: 1;
              padding-left: 2mm;
            }
            .price {
              width: 20mm;
              text-align: right;
            }
            .notes {
              font-size: 8pt;
              font-style: italic;
              margin-left: 12mm;
              margin-bottom: 2mm;
            }
            .section-title {
              font-weight: bold;
              margin: 3mm 0;
            }
            .total {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              margin-top: 5mm;
              font-size: 12pt;
            }
            .footer {
              text-align: center;
              margin-top: 8mm;
              font-size: 9pt;
            }
            .cut-line {
              text-align: center;
              margin-top: 10mm;
              border-top: 1px dashed #000;
              position: relative;
            }
            .cut-line:before {
              content: "✂";
              position: absolute;
              left: -4mm;
              top: -3mm;
              font-size: 8pt;
            }
            @media print {
              body {
                width: 80mm;
                margin: 0;
              }
              .receipt {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>LA VECCHIA SIGNORA</h1>
            </div>
            
            <div class="info">
              <div>Tavolo: ${table.tableNumber}</div>
              <div>Data: ${dateString} ${timeString}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="item-header">
              <div class="qty">Qt</div>
              <div class="name">Prodotto</div>
              <div class="price">Prezzo</div>
            </div>
            
            <div class="divider"></div>
      `;
      
      // Check if we have any items
      if (!order.items || order.items.length === 0) {
        html += `<div class="item"><div colspan="3">Nessun prodotto nell'ordine</div></div>`;
      } else {
        // Process first course if we have course separation
        let firstCoursePrinted = false;
        let secondCoursePrinted = false;
        
        // Add items
        for (let i = 0; i < order.items.length; i++) {
          const item = order.items[i];
          const prevItem = i > 0 ? order.items[i - 1] : null;
          
          // Check if we need to print course headers
          if (hasFirstCourse && hasSecondCourse) {
            if (!firstCoursePrinted) {
              html += `<div class="section-title">PRIMI</div>`;
              firstCoursePrinted = true;
            }
            
            if (!secondCoursePrinted && prevItem && prevItem.isLastFirstCourse) {
              html += `<div class="divider"></div>
                       <div class="section-title">SECONDI</div>`;
              secondCoursePrinted = true;
            }
          }
          
          // Calculate item total price
          const itemTotal = item.quantity * item.menuItem.price;
          const formattedPrice = `€${itemTotal.toFixed(2)}`;
          
          // Add item
          html += `
            <div class="item">
              <div class="qty">${item.quantity}x</div>
              <div class="name">${item.menuItem.name}</div>
              <div class="price">${formattedPrice}</div>
            </div>
          `;
          
          // Add notes if present
          if (item.notes) {
            html += `<div class="notes">Note: ${item.notes}</div>`;
          }
        }
      }
      
      // Add water and bread
      if (order.stillWater > 0 || order.sparklingWater > 0 || order.bread > 0) {
        html += `
          <div class="divider"></div>
          <div class="section-title">EXTRA</div>
        `;
        
        if (order.stillWater > 0) {
          html += `
            <div class="item">
              <div class="qty">${order.stillWater}x</div>
              <div class="name">Acqua Naturale</div>
              <div class="price"></div>
            </div>
          `;
        }
        
        if (order.sparklingWater > 0) {
          html += `
            <div class="item">
              <div class="qty">${order.sparklingWater}x</div>
              <div class="name">Acqua Frizzante</div>
              <div class="price"></div>
            </div>
          `;
        }
        
        if (order.bread > 0) {
          html += `
            <div class="item">
              <div class="qty">${order.bread}x</div>
              <div class="name">Pane</div>
              <div class="price"></div>
            </div>
          `;
        }
      }
      
      // Add total
      html += `
        <div class="divider"></div>
        <div class="total">
          <div>TOTALE:</div>
          <div>€${totalAmount.toFixed(2)}</div>
        </div>
        
        <div class="footer">
          Grazie per la Sua visita!
        </div>
        
        <div class="cut-line"></div>
      </div>
    </body>
    </html>
      `;
      
      return html;
    } catch (error) {
      console.error("Error generating HTML receipt:", error);
      return `
        <html>
          <body>
            <div style="color: red; padding: 20px;">
              Errore nella generazione del documento.
            </div>
          </body>
        </html>
      `;
    }
  }
}
