import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query, transaction } from '@/lib/db';
import { calculateDistanceMeters, getServerObservedIp } from '@/lib/geo-ip';

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { latitude, longitude, gps_accuracy = 10, device_info = 'Web Browser', device_id = 'client-browser-id' } = body;

    if (!latitude || !longitude) {
      return jsonError('Latitude and longitude coordinates are required for attendance check-in', 400);
    }

    // Get student record for user
    const stuRes = await query(
      `SELECT s.id, s.company_id, s.organization_id, s.full_name,
              ce.course_id, ce.batch_id
       FROM students s
       LEFT JOIN course_enrollments ce ON ce.student_id = s.id
       WHERE s.user_id = $1`,
      [auth.user.id]
    );

    if (stuRes.rows.length === 0) {
      return jsonError('Only registered students can check in for attendance', 403);
    }

    const student = stuRes.rows[0];
    const today = new Date().toISOString().split('T')[0];

    // Check duplicate check-in
    const existingRes = await query(
      `SELECT id, check_in_time FROM attendance WHERE student_id = $1 AND date = $2`,
      [student.id, today]
    );

    if (existingRes.rows.length > 0) {
      return jsonError('Duplicate check-in detected. You have already checked in for today.', 400);
    }

    const serverIp = getServerObservedIp(request);

    // Fetch approved geofence locations for company
    const locRes = await query(
      `SELECT * FROM company_locations WHERE company_id = $1 AND is_active = true`,
      [student.company_id]
    );

    let nearestDistance = null;
    let matchedLocation = null;
    let isWithinGeofence = false;

    if (locRes.rows.length > 0) {
      for (const loc of locRes.rows) {
        const dist = calculateDistanceMeters(latitude, longitude, loc.latitude, loc.longitude);
        if (nearestDistance === null || dist < nearestDistance) {
          nearestDistance = dist;
          matchedLocation = loc;
        }
      }

      if (matchedLocation && nearestDistance <= matchedLocation.radius_meters) {
        isWithinGeofence = true;
      }
    } else {
      // If company has no geofences configured, allow check-in with 0 distance
      nearestDistance = 0;
      isWithinGeofence = true;
    }

    const isFlagged = !isWithinGeofence || gps_accuracy > 100;
    const flagReason = !isWithinGeofence
      ? `Check-in is ${nearestDistance}m away from nearest campus boundary (Allowed: ${matchedLocation?.radius_meters || 150}m)`
      : gps_accuracy > 100
      ? `Suspicious low GPS accuracy: ±${gps_accuracy}m`
      : null;

    const result = await transaction(async ({ query: q }) => {
      // 1. Insert Attendance record
      const attRes = await q(
        `INSERT INTO attendance (
          organization_id, company_id, course_id, batch_id, student_id, date, check_in_time,
          latitude, longitude, gps_accuracy, server_ip, device_info, device_id, distance_meters,
          status, is_verified, is_flagged, flag_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          student.organization_id,
          student.company_id,
          student.course_id,
          student.batch_id,
          student.id,
          today,
          latitude,
          longitude,
          gps_accuracy,
          serverIp,
          device_info,
          device_id,
          nearestDistance,
          'present',
          isWithinGeofence,
          isFlagged,
          flagReason,
        ]
      );
      const att = attRes.rows[0];

      // 2. Insert Location Log
      await q(
        `INSERT INTO attendance_location_logs (attendance_id, raw_lat, raw_lng, accuracy, matched_location_id, calculated_distance)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [att.id, latitude, longitude, gps_accuracy, matchedLocation?.id || null, nearestDistance]
      );

      // 3. Insert IP Log
      await q(
        `INSERT INTO attendance_ip_logs (attendance_id, student_id, ip_address, user_agent)
         VALUES ($1, $2, $3, $4)`,
        [att.id, student.id, serverIp, device_info]
      );

      // 4. IP Match Detection: Check if another student checked in from the SAME public IP today
      const matchRes = await q(
        `SELECT a.id, a.student_id, a.check_in_time, s.full_name as other_student_name, s.student_id_code
         FROM attendance a
         JOIN students s ON s.id = a.student_id
         WHERE a.date = $1 
           AND a.server_ip = $2 
           AND a.student_id != $3 
           AND a.organization_id = $4`,
        [today, serverIp, student.id, student.organization_id]
      );

      if (matchRes.rows.length > 0) {
        for (const other of matchRes.rows) {
          await q(
            `INSERT INTO attendance_ip_matches (
              organization_id, company_id, batch_id, date, ip_address,
              student_a_id, student_b_id, check_in_time_a, check_in_time_b, status, admin_notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, 'pending', $9)`,
            [
              student.organization_id,
              student.company_id,
              student.batch_id,
              today,
              serverIp,
              other.student_id,
              student.id,
              other.check_in_time,
              `Server detected matching public IP [${serverIp}] between ${student.full_name} and ${other.other_student_name}`,
            ]
          );

          // Notify admins
          await q(
            `INSERT INTO notifications (user_id, title, message, type, link_url)
             SELECT u.id, 'IP Match Alert Detected', $1, 'warning', '/admin/attendance/ip-matches'
             FROM users u
             JOIN user_roles ur ON ur.user_id = u.id
             JOIN roles r ON r.id = ur.role_id
             WHERE r.code IN ('ORG_ADMIN', 'COMPANY_ADMIN') AND u.organization_id = $2`,
            [`IP Match alert: Student ${student.full_name} checked in using an IP matching Student ${other.other_student_name} (${serverIp}).`, student.organization_id]
          );
        }
      }

      return att;
    });

    return jsonSuccess(
      result,
      isFlagged
        ? `Check-in recorded with caution: ${flagReason}`
        : 'Attendance verified and recorded successfully inside geofence boundary'
    );
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
