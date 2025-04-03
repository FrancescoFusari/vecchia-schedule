
import jsPDF from 'jspdf';
import { OrderWithItems, RestaurantTable } from './types';

// Configure for thermal printer with 80mm width (standard for Epson TM-T20III)
const THERMAL_WIDTH = 80; // 80mm width
const THERMAL_MARGIN = 3; // margin in mm
const LINE_HEIGHT = 5; // line height in mm
const TEXT_SIZE_HEADER = 10; // header text size
const TEXT_SIZE_NORMAL = 8; // normal text size
const TEXT_SIZE_SMALL = 7; // small text size

export class PrintService {
  static generateOrderPDF(order: OrderWithItems, table: RestaurantTable): jsPDF {
    // Create a PDF document with custom size for 80mm thermal printer
    // Height is initially set to 297mm but will be adjusted later based on content
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [THERMAL_WIDTH, 297],  // Start with standard height, will trim later
      hotfixes: ["px_scaling"], // Fix text rendering issues
      compress: false // Disable compression for better compatibility
    });
    
    // Set initial y position
    let y = THERMAL_MARGIN;
    
    // Add restaurant name as header
    doc.setFontSize(TEXT_SIZE_HEADER);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Force black text color
    
    // Center the header
    const restaurantName = 'LA VECCHIA SIGNORA';
    const textWidth = doc.getTextWidth(restaurantName);
    const centerX = (THERMAL_WIDTH - textWidth) / 2;
    doc.text(restaurantName, centerX, y);
    y += LINE_HEIGHT * 1.5;
    
    // Add order information
    doc.setFontSize(TEXT_SIZE_NORMAL);
    doc.setFont('helvetica', 'normal');
    
    // Table number
    doc.text(`Tavolo: ${table.tableNumber}`, THERMAL_MARGIN, y);
    y += LINE_HEIGHT;
    
    // Format date and time
    const orderDate = new Date(order.createdAt);
    const dateString = orderDate.toLocaleDateString('it-IT');
    const timeString = orderDate.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    doc.text(`Data: ${dateString} ${timeString}`, THERMAL_MARGIN, y);
    y += LINE_HEIGHT * 1.2;
    
    // Add dashed separator line
    this.drawDashedLine(doc, THERMAL_MARGIN, y, THERMAL_WIDTH - THERMAL_MARGIN, y);
    y += LINE_HEIGHT * 0.8;
    
    // Add items header
    doc.setFont('helvetica', 'bold');
    doc.text('Qt', THERMAL_MARGIN, y);
    doc.text('Prodotto', THERMAL_MARGIN + 8, y);
    doc.text('Prezzo', THERMAL_WIDTH - THERMAL_MARGIN - 15, y);
    y += LINE_HEIGHT * 0.8;
    
    // Add separator
    this.drawDashedLine(doc, THERMAL_MARGIN, y, THERMAL_WIDTH - THERMAL_MARGIN, y);
    y += LINE_HEIGHT * 0.8;
    
    // Add items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(TEXT_SIZE_NORMAL);
    
    let firstCoursePrinted = false;
    let secondCoursePrinted = false;
    
    // Track if we need to show section headers
    const hasFirstCourse = order.items.some(item => !item.isLastFirstCourse);
    const hasSecondCourse = order.items.some(item => item.isLastFirstCourse) || 
                           order.items.findIndex(item => item.isLastFirstCourse) < order.items.length - 1;
    
    let totalAmount = 0;
    
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      const prevItem = i > 0 ? order.items[i - 1] : null;
      
      // Check if we need to print course headers
      if (hasFirstCourse && hasSecondCourse) {
        if (!firstCoursePrinted) {
          doc.setFont('helvetica', 'bold');
          doc.text('PRIMI', THERMAL_MARGIN, y);
          y += LINE_HEIGHT * 0.8;
          doc.setFont('helvetica', 'normal');
          firstCoursePrinted = true;
        }
        
        if (!secondCoursePrinted && prevItem && prevItem.isLastFirstCourse) {
          // Add separator
          this.drawDashedLine(doc, THERMAL_MARGIN, y, THERMAL_WIDTH - THERMAL_MARGIN, y);
          y += LINE_HEIGHT * 0.8;
          
          doc.setFont('helvetica', 'bold');
          doc.text('SECONDI', THERMAL_MARGIN, y);
          y += LINE_HEIGHT * 0.8;
          doc.setFont('helvetica', 'normal');
          secondCoursePrinted = true;
        }
      }
      
      // Calculate item total price
      const itemTotal = item.quantity * item.menuItem.price;
      totalAmount += itemTotal;
      
      // Format price
      const formattedPrice = `€${itemTotal.toFixed(2)}`;
      
      // Item quantity
      doc.text(`${item.quantity}x`, THERMAL_MARGIN, y);
      
      // Item name
      const itemName = item.menuItem.name;
      const priceX = THERMAL_WIDTH - THERMAL_MARGIN - doc.getTextWidth(formattedPrice);
      
      // Check if item name is too long
      if (doc.getTextWidth(itemName) > priceX - THERMAL_MARGIN - 8) {
        // Split the item name into multiple lines if needed
        const maxWidth = priceX - THERMAL_MARGIN - 8;
        const words = itemName.split(' ');
        let line = '';
        
        for (let j = 0; j < words.length; j++) {
          const testLine = line + (line ? ' ' : '') + words[j];
          if (doc.getTextWidth(testLine) > maxWidth && j > 0) {
            doc.text(line, THERMAL_MARGIN + 8, y);
            y += LINE_HEIGHT * 0.7;
            line = words[j];
          } else {
            line = testLine;
          }
        }
        
        if (line) {
          doc.text(line, THERMAL_MARGIN + 8, y);
        }
      } else {
        doc.text(itemName, THERMAL_MARGIN + 8, y);
      }
      
      // Price
      doc.text(formattedPrice, priceX, y);
      
      // Add notes if present
      if (item.notes) {
        y += LINE_HEIGHT * 0.7;
        doc.setFontSize(TEXT_SIZE_SMALL);
        doc.text(`Note: ${item.notes}`, THERMAL_MARGIN + 8, y);
        doc.setFontSize(TEXT_SIZE_NORMAL);
      }
      
      y += LINE_HEIGHT * 0.9;
    }
    
    // Add water and bread
    if (order.stillWater > 0 || order.sparklingWater > 0 || order.bread > 0) {
      // Add separator
      this.drawDashedLine(doc, THERMAL_MARGIN, y, THERMAL_WIDTH - THERMAL_MARGIN, y);
      y += LINE_HEIGHT * 0.8;
      
      doc.setFont('helvetica', 'bold');
      doc.text('EXTRA', THERMAL_MARGIN, y);
      y += LINE_HEIGHT * 0.8;
      doc.setFont('helvetica', 'normal');
      
      if (order.stillWater > 0) {
        doc.text(`${order.stillWater}x`, THERMAL_MARGIN, y);
        doc.text('Acqua Naturale', THERMAL_MARGIN + 8, y);
        y += LINE_HEIGHT * 0.8;
      }
      
      if (order.sparklingWater > 0) {
        doc.text(`${order.sparklingWater}x`, THERMAL_MARGIN, y);
        doc.text('Acqua Frizzante', THERMAL_MARGIN + 8, y);
        y += LINE_HEIGHT * 0.8;
      }
      
      if (order.bread > 0) {
        doc.text(`${order.bread}x`, THERMAL_MARGIN, y);
        doc.text('Pane', THERMAL_MARGIN + 8, y);
        y += LINE_HEIGHT * 0.8;
      }
    }
    
    // Add separator for total
    this.drawDashedLine(doc, THERMAL_MARGIN, y, THERMAL_WIDTH - THERMAL_MARGIN, y);
    y += LINE_HEIGHT * 1.2;
    
    // Add total
    doc.setFont('helvetica', 'bold');
    doc.text("TOTALE:", THERMAL_MARGIN, y);
    
    const formattedTotal = `€${totalAmount.toFixed(2)}`;
    const totalX = THERMAL_WIDTH - THERMAL_MARGIN - doc.getTextWidth(formattedTotal);
    doc.text(formattedTotal, totalX, y);
    
    y += LINE_HEIGHT * 1.5;
    
    // Add footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(TEXT_SIZE_SMALL);
    const footerText = 'Grazie per la Sua visita!';
    const footerWidth = doc.getTextWidth(footerText);
    const footerX = (THERMAL_WIDTH - footerWidth) / 2;
    doc.text(footerText, footerX, y);
    
    // Add cut line at the bottom
    y += LINE_HEIGHT * 1.5;
    this.drawCutLine(doc, THERMAL_MARGIN, y, THERMAL_WIDTH - THERMAL_MARGIN, y);
    
    // Add some space at the bottom
    y += LINE_HEIGHT;
    
    // Trim the document to the actual content height
    const pdfHeight = y + THERMAL_MARGIN;
    doc.internal.pageSize.height = pdfHeight;
    
    return doc;
  }
  
  // Helper method to draw dashed line without using setLineDash
  private static drawDashedLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number) {
    const dashLength = 2;
    const gapLength = 1;
    
    const length = x2 - x1;
    const dashCount = Math.floor(length / (dashLength + gapLength));
    
    for (let i = 0; i < dashCount; i++) {
      const startX = x1 + i * (dashLength + gapLength);
      const endX = startX + dashLength;
      doc.line(startX, y1, endX, y1);
    }
  }
  
  // Helper method to draw a cut line (scissor line)
  private static drawCutLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number) {
    // Draw a scissors symbol
    doc.setFontSize(6);
    doc.text('✂', x1 - 2, y1);
    
    // Draw the cut line
    const dashLength = 1;
    const gapLength = 1;
    
    const length = x2 - x1;
    const dashCount = Math.floor(length / (dashLength + gapLength));
    
    for (let i = 0; i < dashCount; i++) {
      const startX = x1 + i * (dashLength + gapLength);
      const endX = startX + dashLength;
      doc.line(startX, y1, endX, y1);
    }
  }
}
