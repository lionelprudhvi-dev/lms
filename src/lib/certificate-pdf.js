import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export async function generateCertificatePdf({
  certificateNumber,
  studentName,
  courseName,
  companyName,
  organizationName,
  issueDate,
  signatoryName = 'Dr. Evelyn Vance',
  signatoryTitle = 'Academic Dean & Principal',
  verificationUrl,
}) {
  const pdfDoc = await PDFDocument.create();
  // Landscape A4: 842 x 595
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette
  const navy = rgb(11 / 255, 42 / 255, 91 / 255);
  const primaryBlue = rgb(29 / 255, 78 / 255, 216 / 255);
  const gold = rgb(217 / 255, 119 / 255, 6 / 255);
  const gray = rgb(91 / 255, 107 / 255, 136 / 255);

  // Outer border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: navy,
    borderWidth: 4,
  });

  // Inner decorative border
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: gold,
    borderWidth: 1.5,
  });

  // Organization Header
  const orgText = (organizationName || 'APEX GLOBAL LEARNING GROUP').toUpperCase();
  const orgWidth = fontBold.widthOfTextAtSize(orgText, 14);
  page.drawText(orgText, {
    x: (width - orgWidth) / 2,
    y: height - 70,
    size: 14,
    font: fontBold,
    color: primaryBlue,
  });

  // Company Name
  const compText = companyName || 'Apex Institute of Technology';
  const compWidth = fontRegular.widthOfTextAtSize(compText, 12);
  page.drawText(compText, {
    x: (width - compWidth) / 2,
    y: height - 90,
    size: 12,
    font: fontRegular,
    color: gray,
  });

  // Title: CERTIFICATE OF EXCELLENCE
  const certTitle = 'CERTIFICATE OF EXCELLENCE';
  const titleWidth = fontBold.widthOfTextAtSize(certTitle, 28);
  page.drawText(certTitle, {
    x: (width - titleWidth) / 2,
    y: height - 145,
    size: 28,
    font: fontBold,
    color: navy,
  });

  // "This is proudly presented to"
  const presentedText = 'This credential is proud and officially presented to';
  const presentedWidth = fontRegular.widthOfTextAtSize(presentedText, 14);
  page.drawText(presentedText, {
    x: (width - presentedWidth) / 2,
    y: height - 190,
    size: 14,
    font: fontOblique,
    color: gray,
  });

  // Student Full Name
  const nameText = studentName || 'Student Candidate';
  const nameWidth = fontBold.widthOfTextAtSize(nameText, 32);
  page.drawText(nameText, {
    x: (width - nameWidth) / 2,
    y: height - 245,
    size: 32,
    font: fontBold,
    color: primaryBlue,
  });

  // Horizontal Accent Bar
  page.drawLine({
    start: { x: (width - nameWidth) / 2 - 20, y: height - 260 },
    end: { x: (width + nameWidth) / 2 + 20, y: height - 260 },
    thickness: 2,
    color: gold,
  });

  // "for successfully completing..."
  const bodyText1 = 'for successfully fulfilling all curriculum requirements and practical evaluations in';
  const bodyWidth1 = fontRegular.widthOfTextAtSize(bodyText1, 13);
  page.drawText(bodyText1, {
    x: (width - bodyWidth1) / 2,
    y: height - 295,
    size: 13,
    font: fontRegular,
    color: gray,
  });

  // Course Name
  const courseText = courseName || 'Advanced Cloud & Full Stack Architecture';
  const courseWidth = fontBold.widthOfTextAtSize(courseText, 20);
  page.drawText(courseText, {
    x: (width - courseWidth) / 2,
    y: height - 330,
    size: 20,
    font: fontBold,
    color: navy,
  });

  // Issue date & Credential ID
  const metaText = `Issued on: ${issueDate || '2026-11-26'}   •   Certificate ID: ${certificateNumber}`;
  const metaWidth = fontRegular.widthOfTextAtSize(metaText, 11);
  page.drawText(metaText, {
    x: (width - metaWidth) / 2,
    y: height - 365,
    size: 11,
    font: fontRegular,
    color: gray,
  });

  // Generate QR Code
  try {
    const qrTargetUrl = verificationUrl || `https://apexlms.org/verify/${certificateNumber}`;
    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, { margin: 1, width: 200 });
    const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    // Draw QR on left bottom
    page.drawImage(qrImage, {
      x: 75,
      y: 55,
      width: 75,
      height: 75,
    });

    page.drawText('Scan to Verify Online', {
      x: 65,
      y: 42,
      size: 9,
      font: fontRegular,
      color: gray,
    });
  } catch (err) {
    console.error('QR code generation error in PDF:', err);
  }

  // Signatory on right bottom
  const sigLine = '_________________________________';
  page.drawText(sigLine, {
    x: width - 260,
    y: 90,
    size: 12,
    font: fontRegular,
    color: gray,
  });

  page.drawText(signatoryName, {
    x: width - 240,
    y: 72,
    size: 12,
    font: fontBold,
    color: navy,
  });

  page.drawText(signatoryTitle, {
    x: width - 240,
    y: 56,
    size: 10,
    font: fontRegular,
    color: gray,
  });

  return await pdfDoc.save();
}
