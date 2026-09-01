import jsPDF from 'jspdf';
import { Budget, ProjectType } from '../types';
import { formatARS, formatDateAR } from './currency';

export function generateBudgetPDF(budget: Budget): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Header Background Accent Bar
  doc.setFillColor(52, 135, 124); // #34877c (UNKE Teal)
  doc.rect(0, 0, pageWidth, 7, 'F');

  currentY = 22;

  // UNKE Logo / Wordmark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(52, 135, 124);
  doc.text('UNKE', margin, currentY);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(119, 119, 119); // #777777
  doc.text('ESTUDIO DE DISEÑO & COMUNICACIÓN', margin, currentY + 6);

  // Budget Number & Date on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  const budgetTitle = `PRESUPUESTO Nº ${budget.number || '001'}`;
  doc.text(budgetTitle, pageWidth - margin, currentY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha: ${formatDateAR(budget.date)}`, pageWidth - margin, currentY + 5.5, { align: 'right' });
  doc.text(`Válido hasta: ${formatDateAR(budget.validUntilDate)}`, pageWidth - margin, currentY + 10.5, { align: 'right' });

  // Divider Line
  currentY += 16;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Client Information Box
  currentY += 8;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'S');

  // Client Details inside Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(52, 135, 124);
  doc.text('INFORMACIÓN DEL CLIENTE Y PROYECTO', margin + 5, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(budget.clientName || 'Cliente', margin + 5, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  if (budget.clientContact) {
    doc.text(`Contacto: ${budget.clientContact}`, margin + 5, currentY + 18);
  } else {
    doc.text(`Proyecto: ${budget.title}`, margin + 5, currentY + 18);
  }

  // Project Type badge
  const getProjectTypeLabel = (type: ProjectType) => {
    switch (type) {
      case 'mantenimiento':
        return 'ABONO MENSUAL';
      case 'hibrido':
        return 'PROYECTO PUNTUAL + ABONO MENSUAL';
      case 'proyecto':
      default:
        return 'PROYECTO PUNTUAL';
    }
  };

  const typeLabel = getProjectTypeLabel(budget.projectType);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(52, 135, 124);
  doc.text(`TIPO: ${typeLabel}`, pageWidth - margin - 5, currentY + 12, { align: 'right' });

  currentY += 32;

  // Proposal Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(budget.title || 'Propuesta de Servicios de Diseño', margin, currentY);

  currentY += 6;

  // Table Headers
  const colDesc = margin;
  const colWidthDesc = contentWidth * 0.55;
  const colQty = margin + colWidthDesc;
  const colWidthQty = contentWidth * 0.12;
  const colPrice = colQty + colWidthQty;
  const colWidthPrice = contentWidth * 0.16;
  const colTotal = colPrice + colWidthPrice;

  doc.setFillColor(52, 135, 124);
  doc.rect(margin, currentY, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPCIÓN / ENTREGABLES', colDesc + 4, currentY + 5.5);
  doc.text('CANT.', colQty + 2, currentY + 5.5);
  doc.text('P. UNITARIO', colPrice + 2, currentY + 5.5);
  doc.text('TOTAL (ARS)', pageWidth - margin - 4, currentY + 5.5, { align: 'right' });

  currentY += 8;

  // Table Rows
  budget.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const rowHeight = 9;
    const isItemMonthly = item.isMonthly || budget.projectType === 'mantenimiento';

    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    // If hybrid, suffix or prefix the item description
    let descText = item.description;
    if (budget.projectType === 'hibrido') {
      descText = `[${isItemMonthly ? 'Mensual' : 'Puntual'}] ${descText}`;
    }

    // Truncate long descriptions if needed
    const splitDesc = doc.splitTextToSize(descText, colWidthDesc - 6);
    doc.text(splitDesc[0] || '', colDesc + 4, currentY + 6);
    doc.text(String(item.quantity || 1), colQty + 2, currentY + 6);

    const priceText = isItemMonthly
      ? `${formatARS(item.unitPrice, false)}/m`
      : formatARS(item.unitPrice, false);
    doc.text(priceText, colPrice + 2, currentY + 6);

    doc.setFont('helvetica', 'bold');
    const totalText = isItemMonthly
      ? `${formatARS(item.total, false)}/m`
      : formatARS(item.total, false);
    doc.text(totalText, pageWidth - margin - 4, currentY + 6, { align: 'right' });

    currentY += rowHeight;

    // Add border bottom to row
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, currentY, pageWidth - margin, currentY);
  });

  // Table summary & Totals Box
  currentY += 4;
  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  // Breakdown for hybrid
  if (budget.projectType === 'hibrido') {
    const punctualSub = budget.items
      .filter(i => !i.isMonthly)
      .reduce((acc, curr) => acc + (curr.total || 0), 0);
    const monthlySub = budget.items
      .filter(i => i.isMonthly)
      .reduce((acc, curr) => acc + (curr.total || 0), 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9); // amber
    doc.text('• Implementación puntual:', summaryBoxX, currentY + 3);
    doc.text(formatARS(punctualSub, false), pageWidth - margin, currentY + 3, { align: 'right' });

    doc.setTextColor(126, 34, 206); // purple
    doc.text('• Abono mensual:', summaryBoxX, currentY + 7);
    doc.text(`${formatARS(monthlySub, false)}/mes`, pageWidth - margin, currentY + 7, { align: 'right' });

    currentY += 10;
  }

  if (budget.discountPercentage && budget.discountPercentage > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal:', summaryBoxX, currentY + 4);
    doc.text(formatARS(budget.subtotal, false), pageWidth - margin, currentY + 4, { align: 'right' });

    doc.setTextColor(225, 29, 72); // rose discount
    doc.text(`Descuento (${budget.discountPercentage}%):`, summaryBoxX, currentY + 9);
    const discountAmount = (budget.subtotal * budget.discountPercentage) / 100;
    doc.text(`- ${formatARS(discountAmount, false)}`, pageWidth - margin, currentY + 9, { align: 'right' });

    currentY += 10;
  }

  // Total Final Banner
  doc.setFillColor(240, 247, 246); // light teal background
  doc.roundedRect(summaryBoxX - 4, currentY, summaryBoxWidth + 4, 12, 1.5, 1.5, 'F');
  doc.setDrawColor(52, 135, 124);
  doc.setLineWidth(0.5);
  doc.roundedRect(summaryBoxX - 4, currentY, summaryBoxWidth + 4, 12, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(52, 135, 124);
  const totalLabel =
    budget.projectType === 'mantenimiento'
      ? 'TOTAL MENSUAL:'
      : budget.projectType === 'hibrido'
      ? 'TOTAL ESTIMADO:'
      : 'TOTAL FINAL:';
  doc.text(totalLabel, summaryBoxX, currentY + 7.5);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatARS(budget.totalAmount, false), pageWidth - margin - 2, currentY + 7.5, { align: 'right' });

  currentY += 18;

  // Deliverables Clarification & Detailed Scope
  if (budget.deliverablesClarification) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(52, 135, 124);
    doc.text('ACLARACIONES & ALCANCE DE ENTREGABLES', margin, currentY);
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    const cleanLines = budget.deliverablesClarification
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/<b>(.*?)<\/b>/g, '$1')
      .replace(/<i>(.*?)<\/i>/g, '$1')
      .split('\n');

    cleanLines.forEach(line => {
      if (line.trim().length === 0) {
        currentY += 2;
        return;
      }
      const isBullet = /^\s*([•\-\*]|\d+\.)\s*/.test(line);
      const text = isBullet ? line.replace(/^\s*([•\-\*]|\d+\.)\s*/, '• ') : line;
      const splitLines = doc.splitTextToSize(text, contentWidth);
      doc.text(splitLines, margin + (isBullet ? 2 : 0), currentY);
      currentY += splitLines.length * 3.5;
    });

    currentY += 5;
  }

  // Bank & Payment Information
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, contentWidth, 28, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, currentY, contentWidth, 28, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(52, 135, 124);
  doc.text('DATOS PARA TRANSFERENCIA BANCARIA', margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const bd = budget.bankDetails;
  doc.text(`Banco: ${bd.bank || 'Banco Galicia / Santander'}`, margin + 4, currentY + 11);
  doc.text(`Titular: ${bd.accountHolder || 'UNKE Estudio'}`, margin + 4, currentY + 16);
  doc.text(`CUIT / CUIL: ${bd.cuit || '20-XXXXXXXX-X'}`, margin + 4, currentY + 21);

  doc.setFont('helvetica', 'bold');
  doc.text(`CBU: ${bd.cbu || '0070000000000000000000'}`, margin + contentWidth / 2, currentY + 11);
  doc.setTextColor(52, 135, 124);
  doc.text(`ALIAS: ${bd.alias || 'UNKE.ESTUDIO.DCV'}`, margin + contentWidth / 2, currentY + 17);

  currentY += 34;

  // Terms & Notes
  if (budget.notesAndTerms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('CONDICIONES Y ALCANCE DEL SERVICIO', margin, currentY);

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const splitTerms = doc.splitTextToSize(budget.notesAndTerms, contentWidth);
    doc.text(splitTerms, margin, currentY);
  }

  // Bottom Footer
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('UNKE • Estudio de Diseño y Comunicación • unkedcv@gmail.com', margin, footerY);
  doc.text('Valores expresados en Pesos Argentinos (ARS)', pageWidth - margin, footerY, { align: 'right' });

  // Save PDF
  const filename = `Presupuesto_UNKE_${budget.number || '001'}_${budget.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
