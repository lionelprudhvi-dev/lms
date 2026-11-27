import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const res = await query(
      `SELECT ct.*, c.name as company_name
       FROM certificate_templates ct
       LEFT JOIN companies c ON c.id = ct.company_id
       WHERE ct.organization_id = $1
       ORDER BY ct.created_at DESC`,
      [auth.user.organization_id]
    );

    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'certificates.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const {
      name,
      title = 'Certificate of Completion',
      company_id = null,
      background_color = '#FFFFFF',
      border_style = 'double',
      primary_color = '#0B2A5B',
      secondary_color = '#1D4ED8',
      header_text = 'This is proudly presented to',
      body_template = 'for outstandingly and successfully completing the course requirements and practical assessments.',
      footer_text = 'Issued with pride and high distinction.',
      signatory_name = 'Dr. Evelyn Vance',
      signatory_title = 'Academic Director',
      is_active = true,
    } = body;

    if (!name) {
      return jsonError('Template name is required', 400);
    }

    const res = await query(
      `INSERT INTO certificate_templates (
         organization_id, company_id, name, title, background_color, border_style,
         primary_color, secondary_color, header_text, body_template, footer_text,
         signatory_name, signatory_title, is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        auth.user.organization_id,
        company_id || null,
        name,
        title,
        background_color,
        border_style,
        primary_color,
        secondary_color,
        header_text,
        body_template,
        footer_text,
        signatory_name,
        signatory_title,
        is_active,
      ]
    );

    return jsonSuccess(res.rows[0], 'Certificate template created successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function PUT(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'certificates.update' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const {
      id,
      name,
      title,
      company_id,
      background_color,
      border_style,
      primary_color,
      secondary_color,
      header_text,
      body_template,
      footer_text,
      signatory_name,
      signatory_title,
      is_active,
    } = body;

    if (!id || !name) {
      return jsonError('Template ID and name are required', 400);
    }

    const res = await query(
      `UPDATE certificate_templates
       SET name = $1, title = $2, company_id = $3, background_color = $4,
           border_style = $5, primary_color = $6, secondary_color = $7,
           header_text = $8, body_template = $9, footer_text = $10,
           signatory_name = $11, signatory_title = $12, is_active = $13,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 AND organization_id = $15
       RETURNING *`,
      [
        name,
        title,
        company_id || null,
        background_color,
        border_style,
        primary_color,
        secondary_color,
        header_text,
        body_template,
        footer_text,
        signatory_name,
        signatory_title,
        is_active,
        id,
        auth.user.organization_id,
      ]
    );

    if (res.rows.length === 0) {
      return jsonError('Template not found', 404);
    }

    return jsonSuccess(res.rows[0], 'Certificate template updated successfully');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function DELETE(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'certificates.delete' });
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return jsonError('Template ID is required', 400);

    await query(
      `DELETE FROM certificate_templates WHERE id = $1 AND organization_id = $2`,
      [id, auth.user.organization_id]
    );

    return jsonSuccess(null, 'Certificate template deleted');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
