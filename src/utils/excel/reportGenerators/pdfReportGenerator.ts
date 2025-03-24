
import JsPDF from 'jspdf';
import 'jspdf-autotable';
import { ResultAnalysis, StudentRecord } from '../types';
import html2canvas from 'html2canvas';

// Function to download PDF report from analyzed data
export const downloadPdfReport = async (elementId: string): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }
    
    // Create PDF document
    const doc = new JsPDF('p', 'mm', 'a4');
    
    // Add title to PDF
    doc.setFontSize(16);
    doc.text('End Semester Result Analysis', 14, 15);
    
    // Use html2canvas to capture the content
    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      logging: false,
    });
    
    // Calculate optimal width and height for the PDF
    const imgWidth = 210 - 20; // A4 width (210mm) minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add the captured content to the PDF
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
    
    // Save the PDF
    doc.save('result-analysis-report.pdf');
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};
