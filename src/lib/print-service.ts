
import jsPDF from 'jspdf';
import { OrderWithItems, RestaurantTable } from './types';

// Configure for thermal printer with 80mm width
// Epson TM-T20III uses 80mm (3.15 inches) wide paper
const PAPER_WIDTH = 80; // 80mm width
const PAPER_MARGIN = 5; // 5mm margins
const LINE_HEIGHT = 3.5; // Reduced line height for compact receipts
const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_SMALL = 8;
const FONT_SIZE_LARGE = 12;

export class PrintService {
  static generateOrderPDF(order: OrderWithItems, table: RestaurantTable): jsPDF {
    // Create a PDF document with custom page size for receipt
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [PAPER_WIDTH, 200] // Start with 200mm height, will be adjusted later
    });
    
    // Set initial y position
    let y = PAPER_MARGIN;
    
    // Add restaurant name header
    doc.setFontSize(FONT_SIZE_LARGE);
    doc.setFont('helvetica', 'bold');
    doc.text('LA VECCHIA SIGNORA', PAPER_WIDTH / 2, y, { align: 'center' });
    y += LINE_HEIGHT * 1.5;
    
    // Add table number
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.text(`TAVOLO ${table.tableNumber}`, PAPER_WIDTH / 2, y, { align: 'center' });
    y += LINE_HEIGHT * 1.5;
    
    // Format date and time
    const orderDate = new Date(order.createdAt);
    const dateString = orderDate.toLocaleDateString('it-IT');
    const timeString = orderDate.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Add order number and date/time
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZE_SMALL);
    doc.text(`Ordine: #${order.id.slice(-4)}`, PAPER_MARGIN, y);
    y += LINE_HEIGHT;
    
    doc.text(`Data: ${dateString} ${timeString}`, PAPER_MARGIN, y);
    y += LINE_HEIGHT * 1.2;
    
    // Add separator
    doc.setLineWidth(0.1);
    doc.line(PAPER_MARGIN, y, PAPER_WIDTH - PAPER_MARGIN, y);
    y += LINE_HEIGHT;
    
    // Add items header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE_NORMAL);
    doc.text('Qt', PAPER_MARGIN, y);
    doc.text('Prodotto', PAPER_MARGIN + 8, y);
    y += LINE_HEIGHT;
    
    // Add separator
    doc.setLineWidth(0.1);
    doc.line(PAPER_MARGIN, y, PAPER_WIDTH - PAPER_MARGIN, y);
    y += LINE_HEIGHT;
    
    // Add items
    doc.setFont('helvetica', 'normal');
    
    // Check if we need to show section headers
    let firstCoursePrinted = false;
    let secondCoursePrinted = false;
    
    // Track if we need to show section headers
    const hasFirstCourse = order.items.some(item => !item.isLastFirstCourse);
    const hasSecondCourse = order.items.some(item => item.isLastFirstCourse) || 
                           order.items.findIndex(item => item.isLastFirstCourse) < order.items.length - 1;
    
    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      const prevItem = i > 0 ? order.items[i - 1] : null;
      
      // Check if we need to print course headers
      if (hasFirstCourse && hasSecondCourse) {
        if (!firstCoursePrinted) {
          doc.setFont('helvetica', 'bold');
          doc.text('PRIMI', PAPER_WIDTH / 2, y, { align: 'center' });
          y += LINE_HEIGHT;
          doc.setFont('helvetica', 'normal');
          firstCoursePrinted = true;
        }
        
        if (!secondCoursePrinted && prevItem && prevItem.isLastFirstCourse) {
          // Add separator
          doc.setLineWidth(0.1);
          doc.line(PAPER_MARGIN, y, PAPER_WIDTH - PAPER_MARGIN, y);
          y += LINE_HEIGHT;
          
          doc.setFont('helvetica', 'bold');
          doc.text('SECONDI', PAPER_WIDTH / 2, y, { align: 'center' });
          y += LINE_HEIGHT;
          doc.setFont('helvetica', 'normal');
          secondCoursePrinted = true;
        }
      }
      
      // Item quantity
      doc.setFontSize(FONT_SIZE_NORMAL);
      doc.text(`${item.quantity}x`, PAPER_MARGIN, y);
      
      // Item name - using a smaller maximum width to fit the receipt
      const itemName = item.menuItem.name;
      
      // Check if the text needs to be wrapped
      const textLines = doc.splitTextToSize(itemName, PAPER_WIDTH - PAPER_MARGIN * 2 - 8);
      doc.text(textLines, PAPER_MARGIN + 8, y);
      
      // Adjust y position based on how many lines were needed
      if (textLines.length > 1) {
        y += LINE_HEIGHT * (textLines.length - 1);
      }
      
      // Add notes if present
      if (item.notes) {
        y += LINE_HEIGHT * 0.8;
        doc.setFontSize(FONT_SIZE_SMALL);
        const noteLines = doc.splitTextToSize(`Note: ${item.notes}`, PAPER_WIDTH - PAPER_MARGIN * 2 - 10);
        doc.text(noteLines, PAPER_MARGIN + 10, y);
        
        // Adjust y position based on how many note lines were needed
        if (noteLines.length > 1) {
          y += LINE_HEIGHT * (noteLines.length - 1);
        }
        
        doc.setFontSize(FONT_SIZE_NORMAL);
      }
      
      y += LINE_HEIGHT * 1.2;
    }
    
    // Add water and bread
    if (order.stillWater > 0 || order.sparklingWater > 0 || order.bread > 0) {
      // Add separator
      doc.setLineWidth(0.1);
      doc.line(PAPER_MARGIN, y, PAPER_WIDTH - PAPER_MARGIN, y);
      y += LINE_HEIGHT;
      
      doc.setFont('helvetica', 'bold');
      doc.text('EXTRA', PAPER_WIDTH / 2, y, { align: 'center' });
      y += LINE_HEIGHT;
      doc.setFont('helvetica', 'normal');
      
      if (order.stillWater > 0) {
        doc.text(`${order.stillWater}x`, PAPER_MARGIN, y);
        doc.text('Acqua Naturale', PAPER_MARGIN + 8, y);
        y += LINE_HEIGHT;
      }
      
      if (order.sparklingWater > 0) {
        doc.text(`${order.sparklingWater}x`, PAPER_MARGIN, y);
        doc.text('Acqua Frizzante', PAPER_MARGIN + 8, y);
        y += LINE_HEIGHT;
      }
      
      if (order.bread > 0) {
        doc.text(`${order.bread}x`, PAPER_MARGIN, y);
        doc.text('Pane', PAPER_MARGIN + 8, y);
        y += LINE_HEIGHT;
      }
    }
    
    // Add separator
    doc.setLineWidth(0.1);
    doc.line(PAPER_MARGIN, y, PAPER_WIDTH - PAPER_MARGIN, y);
    y += LINE_HEIGHT * 1.5;
    
    // Add footer with cut line indicator
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SIZE_SMALL);
    doc.text('Grazie per la Sua visita!', PAPER_WIDTH / 2, y, { align: 'center' });
    y += LINE_HEIGHT * 1.5;
    
    // Add cut line indicator using dashed line pattern
    // Instead of setLineDash, we'll create a dashed line manually
    doc.setLineWidth(0.2);
    
    // Draw dashed line manually
    const dashLength = 1;
    const gapLength = 1;
    const startX = PAPER_MARGIN;
    const endX = PAPER_WIDTH - PAPER_MARGIN;
    const lineY = y;
    
    for (let x = startX; x < endX; x += dashLength + gapLength) {
      const segmentEnd = Math.min(x + dashLength, endX);
      doc.line(x, lineY, segmentEnd, lineY);
    }
    
    doc.setFontSize(FONT_SIZE_SMALL);
    doc.text('✂ - - - - - - - - - - - - - - - - - - - - - - - - - ✂', PAPER_WIDTH / 2, y + 2, { align: 'center' });
    
    // Add final padding
    y += LINE_HEIGHT * 2;
    
    // Set the final PDF height to match content plus bottom margin
    const finalHeight = y + PAPER_MARGIN;
    
    // If needed, resize the PDF to match the content
    if (finalHeight !== doc.internal.pageSize.getHeight()) {
      // Create a new document with the correct height
      const newDoc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [PAPER_WIDTH, finalHeight]
      });
      
      // Add the content from the original document
      newDoc.addPage();
      newDoc.deletePage(1);
      newDoc.addPage([PAPER_WIDTH, finalHeight]);
      newDoc.setPage(1);
      newDoc.addImage(doc.output('dataurlstring'), 'JPEG', 0, 0, PAPER_WIDTH, finalHeight);
      
      return newDoc;
    }
    
    return doc;
  }
}
