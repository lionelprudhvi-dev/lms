import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateReceiptPdf({
  receiptNumber,
  studentName,
  studentIdCode,
  courseName,
  batchName,
  companyName,
  organizationName,
  paymentDate,
  paymentMethod,
  referenceNumber,
  amount,
  previousOutstanding,
  currentOutstanding,
  collectorName = 'Finance Desk',
  remarks,
}) {
  const pdfDoc = await PDFDocument.create();
  // Portrait A4: 595 x 842
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const navy = rgb(11 / 255, 42 / 255, 91 / 255);
  const primaryBlue = rgb(29 / 255, 78 / 255, 216 / 255);
  const gray = rgb(91 / 255, 107 / 255, 136 / 255);
  const lightBg = rgb(245 / 255, 248 / 255, 253 / 255);
  const borderCol = rgb(227 / 255, 234 / 255, 245 / 255);

  // Outer border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: navy,
    borderWidth: 2,
  });

  // Top Brand Header Box
  page.drawRectangle({
    x: 32,
    y: height - 120,
    width: width - 64,
    height: 88,
    color: lightBg,
  });

  // Organization Title
  page.drawText(organizationName || 'APEX GLOBAL LEARNING GROUP', {
    x: 50,
    y: height - 60,
    size: 16,
    font: fontBold,
    color: navy,
  });

  page.drawText(companyName || 'Apex Institute of Technology & Research', {
    x: 50,
    y: height - 78,
    size: 12,
    font: fontRegular,
    color: primaryBlue,
  });

  page.drawText('Official Fee Payment Receipt & Acknowledgment', {
    x: 50,
    y: height - 98,
    size: 10,
    font: fontRegular,
    color: gray,
  });

  // Receipt Number & Date on right
  page.drawText('RECEIPT NO:', {
    x: width - 220,
    y: height - 60,
    size: 9,
    font: fontBold,
    color: gray,
  });
  page.drawText(receiptNumber, {
    x: width - 220,
    y: height - 74,
    size: 12,
    font: fontBold,
    color: navy,
  });

  page.drawText(`Date: ${paymentDate || new Date().toISOString().split('T')[0]}`, {
    x: width - 220,
    y: height - 95,
    size: 10,
    font: fontRegular,
    color: gray,
  });

  // Student Particulars Box
  let y = height - 150;
  page.drawText('STUDENT INFORMATION', { x: 50, y, size: 11, font: fontBold, color: navy });

  y -= 25;
  page.drawRectangle({
    x: 50,
    y: y - 55,
    width: width - 100,
    height: 70,
    borderColor: borderCol,
    borderWidth: 1,
  });

  page.drawText(`Student Name: ${studentName}`, { x: 65, y: y - 5, size: 11, font: fontBold, color: navy });
  page.drawText(`Student ID: ${studentIdCode || 'STU-RECORD'}`, { x: width - 250, y: y - 5, size: 10, font: fontRegular, color: gray });
  page.drawText(`Enrolled Program: ${courseName || 'Professional Technology Diploma'}`, { x: 65, y: y - 25, size: 10, font: fontRegular, color: gray });
  page.drawText(`Batch Cohort: ${batchName || 'Regular Session'}`, { x: 65, y: y - 45, size: 10, font: fontRegular, color: gray });

  // Payment Particulars Table
  y -= 95;
  page.drawText('PAYMENT ALLOCATION & BREAKDOWN', { x: 50, y, size: 11, font: fontBold, color: navy });

  y -= 25;
  // Header row
  page.drawRectangle({
    x: 50,
    y: y - 20,
    width: width - 100,
    height: 25,
    color: navy,
  });
  page.drawText('Description / Particulars', { x: 65, y: y - 13, size: 10, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Method & Ref', { x: 280, y: y - 13, size: 10, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Amount (INR)', { x: width - 160, y: y - 13, size: 10, font: fontBold, color: rgb(1, 1, 1) });

  y -= 25;
  // Item row
  page.drawRectangle({
    x: 50,
    y: y - 35,
    width: width - 100,
    height: 40,
    borderColor: borderCol,
    borderWidth: 1,
  });
  page.drawText('Tuition / Course Installment Fee Payment', { x: 65, y: y - 15, size: 10, font: fontBold, color: navy });
  page.drawText(remarks || 'Official fee collection', { x: 65, y: y - 30, size: 9, font: fontRegular, color: gray });

  page.drawText(`${paymentMethod?.toUpperCase()} (${referenceNumber || 'N/A'})`, {
    x: 280,
    y: y - 20,
    size: 10,
    font: fontRegular,
    color: gray,
  });

  page.drawText(`Rs. ${Number(amount).toLocaleString()}`, {
    x: width - 160,
    y: y - 20,
    size: 12,
    font: fontBold,
    color: primaryBlue,
  });

  // Financial Ledger Summary Box
  y -= 75;
  page.drawRectangle({
    x: width - 280,
    y: y - 75,
    width: 230,
    height: 85,
    color: lightBg,
    borderColor: borderCol,
    borderWidth: 1,
  });

  page.drawText(`Previous Ledger Balance:`, { x: width - 265, y: y - 15, size: 10, font: fontRegular, color: gray });
  page.drawText(`Rs. ${Number(previousOutstanding || 0).toLocaleString()}`, { x: width - 120, y: y - 15, size: 10, font: fontRegular, color: gray });

  page.drawText(`Amount Paid This Receipt:`, { x: width - 265, y: y - 35, size: 10, font: fontBold, color: navy });
  page.drawText(`Rs. ${Number(amount).toLocaleString()}`, { x: width - 120, y: y - 35, size: 10, font: fontBold, color: navy });

  page.drawText(`Current Net Outstanding:`, { x: width - 265, y: y - 58, size: 11, font: fontBold, color: primaryBlue });
  page.drawText(`Rs. ${Number(currentOutstanding || 0).toLocaleString()}`, { x: width - 120, y: y - 58, size: 11, font: fontBold, color: primaryBlue });

  // Notes & Signatures
  y -= 140;
  page.drawText('Important Notes & Terms:', { x: 50, y, size: 9, font: fontBold, color: gray });
  page.drawText('1. Fee payments are acknowledged subject to realization of cheque / online clearance.', { x: 50, y: y - 14, size: 8, font: fontRegular, color: gray });
  page.drawText('2. Retain this digital receipt for examination hall tickets and certificate issuance clearance.', { x: 50, y: y - 26, size: 8, font: fontRegular, color: gray });
  page.drawText('3. Computer-generated authenticated receipt. Physical signature optional.', { x: 50, y: y - 38, size: 8, font: fontRegular, color: gray });

  page.drawText(`Issued by: ${collectorName}`, { x: width - 220, y: y - 14, size: 10, font: fontBold, color: navy });
  page.drawText('Authorized Accounts Desk Stamp', { x: width - 220, y: y - 30, size: 9, font: fontRegular, color: gray });

  return await pdfDoc.save();
}
