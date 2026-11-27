import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'outstanding';
    const companyId = searchParams.get('companyId');

    let compFilter = '';
    const params = [auth.user.organization_id];
    if (companyId) {
      params.push(companyId);
      compFilter = `AND company_id = $${params.length}`;
    }

    let rows = [];

    switch (reportType) {
      case 'outstanding':
        // Outstanding Balances Report
        const outRes = await query(
          `SELECT sfa.*, s.full_name as student_name, s.student_id_code, s.phone,
                  c.name as company_name, cr.name as course_name
           FROM student_fee_accounts sfa
           JOIN students s ON s.id = sfa.student_id
           JOIN companies c ON c.id = sfa.company_id
           LEFT JOIN courses cr ON cr.id = sfa.course_id
           WHERE sfa.organization_id = $1 AND sfa.outstanding_balance > 0 ${compFilter.replace(/company_id/g, 'sfa.company_id')}
           ORDER BY sfa.outstanding_balance DESC`,
          params
        );
        rows = outRes.rows;
        break;

      case 'daily_collection':
        // Daily Collection Report
        const dailyRes = await query(
          `SELECT p.*, s.full_name as student_name, s.student_id_code,
                  r.receipt_number, c.name as company_name
           FROM fee_payments p
           JOIN students s ON s.id = p.student_id
           JOIN companies c ON c.id = p.company_id
           LEFT JOIN payment_receipts r ON r.id = p.receipt_id
           WHERE p.organization_id = $1 AND p.payment_date >= CURRENT_DATE - interval '7 days' ${compFilter.replace(/company_id/g, 'p.company_id')}
           ORDER BY p.payment_date DESC`,
          params
        );
        rows = dailyRes.rows;
        break;

      case 'installments_due':
        // Installment Due Report
        const instRes = await query(
          `SELECT fi.*, s.full_name as student_name, s.student_id_code, s.phone,
                  cr.name as course_name, c.name as company_name
           FROM fee_installments fi
           JOIN student_fee_accounts sfa ON sfa.id = fi.student_fee_account_id
           JOIN students s ON s.id = sfa.student_id
           JOIN companies c ON c.id = sfa.company_id
           LEFT JOIN courses cr ON cr.id = sfa.course_id
           WHERE sfa.organization_id = $1 AND fi.status != 'paid' ${compFilter.replace(/company_id/g, 'sfa.company_id')}
           ORDER BY fi.due_date ASC`,
          params
        );
        rows = instRes.rows;
        break;

      case 'overdue_defaulters':
        // Overdue Defaulters Report
        const overRes = await query(
          `SELECT sfa.*, s.full_name as student_name, s.student_id_code, s.phone, s.email,
                  c.name as company_name, cr.name as course_name
           FROM student_fee_accounts sfa
           JOIN students s ON s.id = sfa.student_id
           JOIN companies c ON c.id = sfa.company_id
           LEFT JOIN courses cr ON cr.id = sfa.course_id
           WHERE sfa.organization_id = $1 AND sfa.status = 'overdue' ${compFilter.replace(/company_id/g, 'sfa.company_id')}
           ORDER BY sfa.outstanding_balance DESC`,
          params
        );
        rows = overRes.rows;
        break;

      case 'staff_performance':
        // Staff Collection Performance
        const staffRes = await query(
          `SELECT u.id, u.first_name, u.last_name, u.email,
                  COUNT(p.id) as transactions_count,
                  COALESCE(SUM(p.amount), 0) as total_collected
           FROM users u
           LEFT JOIN fee_payments p ON p.collected_by = u.id
           WHERE u.organization_id = $1
           GROUP BY u.id
           ORDER BY total_collected DESC`,
          [auth.user.organization_id]
        );
        rows = staffRes.rows;
        break;

      case 'transactions':
      default:
        // Complete Transaction History
        const txRes = await query(
          `SELECT p.*, s.full_name as student_name, s.student_id_code,
                  r.receipt_number, c.name as company_name,
                  u.first_name as collector_first_name, u.last_name as collector_last_name
           FROM fee_payments p
           JOIN students s ON s.id = p.student_id
           JOIN companies c ON c.id = p.company_id
           LEFT JOIN payment_receipts r ON r.id = p.receipt_id
           LEFT JOIN users u ON u.id = p.collected_by
           WHERE p.organization_id = $1 ${compFilter.replace(/company_id/g, 'p.company_id')}
           ORDER BY p.payment_date DESC`,
          params
        );
        rows = txRes.rows;
        break;
    }

    return jsonSuccess({ reportType, rows });
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
