import { query } from '@/lib/db';
import { generateReceiptPdf } from '@/lib/receipt-pdf';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const rcptRes = await query(
      `SELECT r.*,
              c.name as company_name,
              o.name as organization_name,
              s.student_id_code,
              p.reference_number
       FROM payment_receipts r
       JOIN companies c ON c.id = r.company_id
       JOIN organizations o ON o.id = r.organization_id
       JOIN students s ON s.id = r.student_id
       JOIN fee_payments p ON p.id = r.payment_id
       WHERE r.id = $1 OR r.receipt_number = $1`,
      [id]
    );

    if (rcptRes.rows.length === 0) {
      return new NextResponse('Receipt not found', { status: 404 });
    }

    const r = rcptRes.rows[0];

    const pdfBytes = await generateReceiptPdf({
      receiptNumber: r.receipt_number,
      studentName: r.student_name,
      studentIdCode: r.student_id_code,
      courseName: r.course_name,
      batchName: r.batch_name,
      companyName: r.company_name,
      organizationName: r.organization_name,
      paymentDate: r.payment_date ? r.payment_date.toISOString().split('T')[0] : null,
      paymentMethod: r.payment_method,
      referenceNumber: r.reference_number,
      amount: r.amount,
      previousOutstanding: r.previous_outstanding,
      currentOutstanding: r.current_outstanding,
      collectorName: r.collector_name,
      remarks: r.remarks,
    });

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${r.receipt_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Receipt PDF generation error:', err);
    return new NextResponse('Error generating receipt PDF', { status: 500 });
  }
}
