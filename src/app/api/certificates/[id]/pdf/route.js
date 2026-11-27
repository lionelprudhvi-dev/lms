import { query } from '@/lib/db';
import { generateCertificatePdf } from '@/lib/certificate-pdf';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const certRes = await query(
      `SELECT cert.*, c.name as company_name, o.name as organization_name
       FROM certificates cert
       JOIN companies c ON c.id = cert.company_id
       JOIN organizations o ON o.id = cert.organization_id
       WHERE cert.id = $1 OR cert.certificate_number = $1`,
      [id]
    );

    if (certRes.rows.length === 0) {
      return new NextResponse('Certificate not found', { status: 404 });
    }

    const cert = certRes.rows[0];

    const pdfBytes = await generateCertificatePdf({
      certificateNumber: cert.certificate_number,
      studentName: cert.student_name,
      courseName: cert.course_name,
      companyName: cert.company_name,
      organizationName: cert.organization_name,
      issueDate: cert.issue_date,
      verificationUrl: cert.qr_code_data,
    });

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cert.certificate_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
