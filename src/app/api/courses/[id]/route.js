import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { id } = params;

    const courseRes = await query(
      `SELECT cr.*, c.name as company_name, c.code as company_code
       FROM courses cr
       JOIN companies c ON c.id = cr.company_id
       WHERE cr.id = $1 AND cr.organization_id = $2`,
      [id, auth.user.organization_id]
    );

    if (courseRes.rows.length === 0) return jsonError('Course not found', 404);
    const course = courseRes.rows[0];

    // Fetch modules & lessons
    const modulesRes = await query(
      `SELECT cm.*, 
              COALESCE(
                json_agg(
                  jsonb_build_object(
                    'id', cl.id,
                    'title', cl.title,
                    'lesson_type', cl.lesson_type,
                    'duration_mins', cl.duration_mins,
                    'order_index', cl.order_index,
                    'content_text', cl.content_text,
                    'content_url', cl.content_url
                  ) ORDER BY cl.order_index ASC
                ) FILTER (WHERE cl.id IS NOT NULL), '[]'
              ) as lessons
       FROM course_modules cm
       LEFT JOIN course_lessons cl ON cl.module_id = cm.id
       WHERE cm.course_id = $1
       GROUP BY cm.id
       ORDER BY cm.order_index ASC`,
      [id]
    );
    course.modules = modulesRes.rows;

    return jsonSuccess(course);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
