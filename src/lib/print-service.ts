
import jsPDF from 'jspdf';
import { OrderWithItems, RestaurantTable } from './types';

// Configure for thermal printer with 80mm (7.95cm) width
const PAPER_WIDTH = 210; // A4 width in mm
const PRINT_WIDTH = 79.5; // 7.95cm in mm
const MARGIN = 5; // margin in mm
const LINE_HEIGHT = 5; // line height in mm

export class PrintService {
  static generateOrderPDF(order: OrderWithItems, table: RestaurantTable): jsPDF {
    // Create a PDF document with a portrait orientation
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Calculate the scale factor to fit the content within the printer width
    const scaleFactor = PRINT_WIDTH / (PAPER_WIDTH - 2 * MARGIN);
    
    // Set initial y position
    let y = MARGIN;
    
    // Add header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LA VECCHIA SIGNORA', MARGIN, y);
    y += LINE_HEIGHT * 1.5;
    
    // Add order information
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tavolo: ${table.tableNumber}`, MARGIN, y);
    y += LINE_HEIGHT;
    
    // Format date and time
    const orderDate = new Date(order.createdAt);
    const dateString = orderDate.toLocaleDateString('it-IT');
    const timeString = orderDate.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    doc.text(`Data: ${dateString} ${timeString}`, MARGIN, y);
    y += LINE_HEIGHT;
    
    // Add separator
    y += LINE_HEIGHT * 0.5;
    doc.setLineWidth(0.1);
    doc.line(MARGIN, y, PAPER_WIDTH - MARGIN, y);
    y += LINE_HEIGHT;
    
    // Add items header
    doc.setFont('helvetica', 'bold');
    doc.text('Qt', MARGIN, y);
    doc.text('Prodotto', MARGIN + 10, y);
    y += LINE_HEIGHT;
    
    // Add separator
    doc.setLineWidth(0.1);
    doc.line(MARGIN, y, PAPER_WIDTH - MARGIN, y);
    y += LINE_HEIGHT;
    
    // Add items
    doc.setFont('helvetica', 'normal');
    
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
          doc.text('PRIMI', MARGIN, y);
          y += LINE_HEIGHT;
          doc.setFont('helvetica', 'normal');
          firstCoursePrinted = true;
        }
        
        if (!secondCoursePrinted && prevItem && prevItem.isLastFirstCourse) {
          // Add separator
          doc.setLineWidth(0.1);
          doc.line(MARGIN, y, PAPER_WIDTH - MARGIN, y);
          y += LINE_HEIGHT;
          
          doc.setFont('helvetica', 'bold');
          doc.text('SECONDI', MARGIN, y);
          y += LINE_HEIGHT;
          doc.setFont('helvetica', 'normal');
          secondCoursePrinted = true;
        }
      }
      
      // Item quantity
      doc.text(`${item.quantity}x`, MARGIN, y);
      
      // Item name (without price)
      const itemName = item.menuItem.name;
      doc.text(itemName, MARGIN + 10, y);
      
      // Add notes if present
      if (item.notes) {
        y += LINE_HEIGHT * 0.8;
        doc.setFontSize(8);
        doc.text(`Note: ${item.notes}`, MARGIN + 10, y);
        doc.setFontSize(10);
      }
      
      y += LINE_HEIGHT;
    }
    
    // Add water and bread
    if (order.stillWater > 0 || order.sparklingWater > 0 || order.bread > 0) {
      // Add separator
      doc.setLineWidth(0.1);
      doc.line(MARGIN, y, PAPER_WIDTH - MARGIN, y);
      y += LINE_HEIGHT;
      
      doc.setFont('helvetica', 'bold');
      doc.text('EXTRA', MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont('helvetica', 'normal');
      
      if (order.stillWater > 0) {
        doc.text(`${order.stillWater}x`, MARGIN, y);
        doc.text('Acqua Naturale', MARGIN + 10, y);
        y += LINE_HEIGHT;
      }
      
      if (order.sparklingWater > 0) {
        doc.text(`${order.sparklingWater}x`, MARGIN, y);
        doc.text('Acqua Frizzante', MARGIN + 10, y);
        y += LINE_HEIGHT;
      }
      
      if (order.bread > 0) {
        doc.text(`${order.bread}x`, MARGIN, y);
        doc.text('Pane', MARGIN + 10, y);
        y += LINE_HEIGHT;
      }
    }
    
    // Add separator
    doc.setLineWidth(0.1);
    doc.line(MARGIN, y, PAPER_WIDTH - MARGIN, y);
    y += LINE_HEIGHT * 2;
    
    // Add footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Grazie per la Sua visita!', MARGIN, y);
    
    return doc;
  }
}
