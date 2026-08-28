import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { InvoiceData } from '../types';
import { generateStandaloneHtml } from './generateStandaloneHtml';

/**
 * Generates and downloads a crisp, professional A4 PDF for an invoice
 * Configured with skipFonts & fontEmbedCSS to avoid cross-origin CSS rule reading errors
 * Includes html2canvas fallback for 100% reliable PDF generation
 */
export async function downloadInvoicePDF(
  invoice: InvoiceData, 
  sourceElementId: string = 'printable-invoice'
): Promise<boolean> {
  let tempContainer: HTMLDivElement | null = null;
  try {
    let element = document.getElementById(sourceElementId);

    // If element is not currently in DOM or not visible, build a temporary container
    if (!element) {
      tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px'; // standard A4 @ 96dpi (210mm)
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.zIndex = '-1000';
      
      tempContainer.innerHTML = generateStandaloneHtml(invoice);
      document.body.appendChild(tempContainer);

      const innerCard = tempContainer.querySelector('#invoice') || 
                         tempContainer.querySelector('#printable-invoice') || 
                         tempContainer.querySelector('.invoice-wrapper') || 
                         tempContainer;
      element = innerCard as HTMLElement;
    }

    let imgData: string | null = null;

    // Strategy 1: html-to-image with skipFonts to avoid cross-origin cssRules SecurityError
    try {
      imgData = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: '',
        filter: (node: Node) => {
          // Ignore external stylesheet links to eliminate cross-origin access issues
          if (node instanceof HTMLLinkElement && node.rel === 'stylesheet') {
            return false;
          }
          return true;
        },
      });
    } catch (toPngErr) {
      console.warn('html-to-image failed, falling back to html2canvas:', toPngErr);
      // Strategy 2: html2canvas fallback
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      imgData = canvas.toDataURL('image/png', 0.98);
    }

    // Clean up temporary element
    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
      tempContainer = null;
    }

    if (!imgData) {
      throw new Error('Could not generate image data for PDF');
    }

    // Create Image to get exact dimensions
    const img = new Image();
    img.src = imgData;
    await new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });

    // Create A4 PDF in portrait mode
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    const imgWidth = pdfWidth;
    const imgHeight = (img.height * pdfWidth) / (img.width || 1);

    if (imgHeight <= pdfHeight) {
      // Single page
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Multi-page splitting if content height exceeds single A4 page
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    const cleanInvoiceNumber = (invoice.invoiceNumber || 'INV').replace(/[\/\\:*?"<>|]/g, '_');
    const filename = `Faktur-${cleanInvoiceNumber}.pdf`;

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
    // Fallback: trigger print dialog if rendering fails
    window.print();
    return false;
  }
}
