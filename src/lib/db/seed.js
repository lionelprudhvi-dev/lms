import bcrypt from 'bcryptjs';
import { query, transaction } from './index.js';

export async function runSeeds() {
  console.log('--- Starting Database Seeding ---');

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  await transaction(async ({ query: q }) => {
    // 1. Create Organization
    const orgRes = await q(
      `INSERT INTO organizations (name, code, website, email, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Apex Learning Global Group', 'APEX-GLOBAL', 'https://apexlearning.org', 'support@apexlearning.org', '+91 80 4123 4567', 'Tech Corridor, Bengaluru, Karnataka, India']
    );
    const orgId = orgRes.rows[0].id;

    // 2. Organization Settings
    await q(
      `INSERT INTO organization_settings (organization_id, currency, timezone, academic_year, attendance_geofence_default, ip_matching_scope, ip_matching_window_minutes, rules)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        orgId,
        'INR',
        'Asia/Kolkata',
        '2026-2027',
        150,
        'company',
        60,
        JSON.stringify({
          block_materials_on_unpaid: true,
          block_exams_on_unpaid: true,
          block_certificate_on_unpaid: true,
          allow_temporary_admin_override: true,
        }),
      ]
    );

    // 3. Companies
    const comp1Res = await q(
      `INSERT INTO companies (organization_id, name, code, contact_email, contact_phone, gstin, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [orgId, 'Apex Institute of Technology', 'AIT-TECH', 'info@ait-tech.edu', '+91 80 9876 5432', '29AAAAA0000A1Z5', 'Campus 1, MG Road, Bengaluru', 'active']
    );
    const company1Id = comp1Res.rows[0].id;

    const comp2Res = await q(
      `INSERT INTO companies (organization_id, name, code, contact_email, contact_phone, gstin, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [orgId, 'Apex Business & Management Academy', 'ABM-ACAD', 'contact@abm-acad.edu', '+91 80 8765 4321', '29BBBBB1111B1Z6', 'Campus 2, Koramangala, Bengaluru', 'active']
    );
    const company2Id = comp2Res.rows[0].id;

    const comp3Res = await q(
      `INSERT INTO companies (organization_id, name, code, contact_email, contact_phone, gstin, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [orgId, 'Apex Digital Creative Studio', 'ADC-DESIGN', 'admissions@adc-design.edu', '+91 80 7654 3210', '29CCCCC2222C1Z7', 'Design Center, HSR Layout, Bengaluru', 'active']
    );
    const company3Id = comp3Res.rows[0].id;

    // 4. Company Geofenced Approved Locations
    await q(
      `INSERT INTO company_locations (organization_id, company_id, name, latitude, longitude, radius_meters, is_active)
       VALUES 
       ($1, $2, 'AIT MG Road Main Campus', 12.9715987, 77.5945627, 200, true),
       ($1, $3, 'ABM Koramangala Hub', 12.9351929, 77.6244806, 150, true),
       ($1, $4, 'ADC HSR Design Studio', 12.9279232, 77.6271078, 180, true)`,
      [orgId, company1Id, company2Id, company3Id]
    );

    // 5. Attendance Policies
    await q(
      `INSERT INTO attendance_policies (organization_id, company_id, late_grace_minutes, half_day_hours, min_hours_full_day, require_geofence, geofence_radius_meters)
       VALUES 
       ($1, $2, 15, 4, 7, true, 200),
       ($1, $3, 20, 4, 7, true, 150)`,
      [orgId, company1Id, company2Id]
    );

    // 6. Permissions
    const modules = [
      'Organization', 'Company', 'Users', 'Roles', 'Students', 'Trainers',
      'Courses', 'Batches', 'Attendance', 'Attendance Override', 'Examinations',
      'Results', 'Certificates', 'Fee Structures', 'Fee Collection', 'Discounts',
      'Refunds', 'Reports', 'Settings', 'Announcements'
    ];
    const actions = ['create', 'read', 'update', 'delete', 'approve', 'override', 'export', 'print'];

    const permIds = [];
    for (const mod of modules) {
      for (const act of actions) {
        const code = `${mod.toLowerCase().replace(/\s+/g, '_')}.${act}`;
        const pRes = await q(
          `INSERT INTO permissions (module, action, code, description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO UPDATE SET module = EXCLUDED.module
           RETURNING id`,
          [mod, act, code, `Can ${act} ${mod}`]
        );
        permIds.push(pRes.rows[0].id);
      }
    }

    // 7. Roles
    const roleDefs = [
      { name: 'Organization Admin', code: 'ORG_ADMIN', desc: 'Complete organization-wide system superuser', is_sys: true },
      { name: 'Company Admin', code: 'COMPANY_ADMIN', desc: 'Administrative access for designated company', is_sys: true },
      { name: 'HR / Academic Coordinator', code: 'ACADEMIC_COORD', desc: 'Academic scheduling and batch coordinator', is_sys: false },
      { name: 'Trainer', code: 'TRAINER', desc: 'Faculty instructor portal access', is_sys: true },
      { name: 'Student', code: 'STUDENT', desc: 'Learner portal access', is_sys: true },
      { name: 'Examination Administrator', code: 'EXAM_ADMIN', desc: 'Manages exams, question banks and grading', is_sys: false },
      { name: 'Certificate Administrator', code: 'CERT_ADMIN', desc: 'Issues, configures and manages certificates', is_sys: false },
      { name: 'Fee Collection Staff', code: 'FEE_STAFF', desc: 'Fee collections, receipts, dues and installments', is_sys: false },
      { name: 'Reports Viewer', code: 'REPORTS_VIEWER', desc: 'Read-only access to academic and financial reports', is_sys: false },
    ];

    const rolesMap = {};
    for (const r of roleDefs) {
      const rRes = await q(
        `INSERT INTO roles (organization_id, name, code, description, is_system)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [orgId, r.name, r.code, r.desc, r.is_sys]
      );
      rolesMap[r.code] = rRes.rows[0].id;
    }

    // Assign all permissions to ORG_ADMIN
    for (const pId of permIds) {
      await q(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [rolesMap['ORG_ADMIN'], pId]
      );
    }

    // 8. Users
    // Super Org Admin
    const orgAdminRes = await q(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, user_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [orgId, 'admin@apexlms.com', passwordHash, 'Alexander', 'Pierce', '+91 99000 00001', 'admin']
    );
    const orgAdminId = orgAdminRes.rows[0].id;
    await q(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [orgAdminId, rolesMap['ORG_ADMIN']]);
    await q(`INSERT INTO user_company_access (user_id, company_id) VALUES ($1, $2), ($1, $3), ($1, $4)`, [orgAdminId, company1Id, company2Id, company3Id]);

    // Company Admin 1 (AIT-TECH)
    const compAdminRes = await q(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, user_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [orgId, 'ait.admin@apexlms.com', passwordHash, 'David', 'Chen', '+91 99000 00002', 'company_admin']
    );
    const compAdminId = compAdminRes.rows[0].id;
    await q(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [compAdminId, rolesMap['COMPANY_ADMIN']]);
    await q(`INSERT INTO user_company_access (user_id, company_id) VALUES ($1, $2)`, [compAdminId, company1Id]);

    // Trainer 1 (Vikram)
    const trainerUserRes = await q(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, user_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [orgId, 'trainer.vikram@apexlms.com', passwordHash, 'Vikram', 'Rathore', '+91 98450 12345', 'trainer']
    );
    const trainerUserId = trainerUserRes.rows[0].id;
    await q(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [trainerUserId, rolesMap['TRAINER']]);
    await q(`INSERT INTO user_company_access (user_id, company_id) VALUES ($1, $2)`, [trainerUserId, company1Id]);

    const trainer1Res = await q(
      `INSERT INTO trainers (user_id, organization_id, company_id, trainer_id_code, full_name, email, phone, qualification, skills, experience_years, joining_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [trainerUserId, orgId, company1Id, 'TRN-2026-001', 'Vikram Rathore', 'trainer.vikram@apexlms.com', '+91 98450 12345', 'M.Tech in Computer Science', 'Node.js, React, Cloud Architecture, PostgreSQL, DevOps', 8.5, '2023-06-01', 'active']
    );
    const trainer1Id = trainer1Res.rows[0].id;

    // Student 1 (Rahul Sharma)
    const student1UserRes = await q(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, user_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [orgId, 'student.rahul@apexlms.com', passwordHash, 'Rahul', 'Sharma', '+91 91234 56789', 'student']
    );
    const student1UserId = student1UserRes.rows[0].id;
    await q(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [student1UserId, rolesMap['STUDENT']]);
    await q(`INSERT INTO user_company_access (user_id, company_id) VALUES ($1, $2)`, [student1UserId, company1Id]);

    const student1Res = await q(
      `INSERT INTO students (user_id, organization_id, company_id, student_id_code, full_name, email, phone, dob, gender, address, qualification, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [student1UserId, orgId, company1Id, 'STU-2026-101', 'Rahul Sharma', 'student.rahul@apexlms.com', '+91 91234 56789', '2001-04-12', 'Male', 'Flat 402, Green Glen Layout, Bellandur, Bengaluru', 'B.Tech IT', 'active']
    );
    const student1Id = student1Res.rows[0].id;

    // Student 2 (Kiran Kumar - for IP match demo)
    const student2UserRes = await q(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, user_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [orgId, 'student.kiran@apexlms.com', passwordHash, 'Kiran', 'Kumar', '+91 92345 67890', 'student']
    );
    const student2UserId = student2UserRes.rows[0].id;
    await q(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [student2UserId, rolesMap['STUDENT']]);
    await q(`INSERT INTO user_company_access (user_id, company_id) VALUES ($1, $2)`, [student2UserId, company1Id]);

    const student2Res = await q(
      `INSERT INTO students (user_id, organization_id, company_id, student_id_code, full_name, email, phone, dob, gender, address, qualification, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [student2UserId, orgId, company1Id, 'STU-2026-102', 'Kiran Kumar', 'student.kiran@apexlms.com', '+91 92345 67890', '2002-09-21', 'Male', '14/B, Indira Nagar 1st Stage, Bengaluru', 'B.E. Computer Science', 'active']
    );
    const student2Id = student2Res.rows[0].id;

    // Student 3 (Priya Menon in ABM)
    const student3UserRes = await q(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, user_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [orgId, 'student.priya@apexlms.com', passwordHash, 'Priya', 'Menon', '+91 93456 78901', 'student']
    );
    const student3UserId = student3UserRes.rows[0].id;
    await q(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [student3UserId, rolesMap['STUDENT']]);
    await q(`INSERT INTO user_company_access (user_id, company_id) VALUES ($1, $2)`, [student3UserId, company2Id]);

    const student3Res = await q(
      `INSERT INTO students (user_id, organization_id, company_id, student_id_code, full_name, email, phone, dob, gender, address, qualification, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [student3UserId, orgId, company2Id, 'STU-2026-201', 'Priya Menon', 'student.priya@apexlms.com', '+91 93456 78901', '2000-11-05', 'Female', '77, 4th Block Koramangala, Bengaluru', 'B.Com / MBA Candidate', 'active']
    );
    const student3Id = student3Res.rows[0].id;

    // Fee Staff
    const feeStaffUserRes = await q(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, user_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [orgId, 'fee.staff@apexlms.com', passwordHash, 'Suresh', 'Nair', '+91 99000 00005', 'staff']
    );
    const feeStaffUserId = feeStaffUserRes.rows[0].id;
    await q(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [feeStaffUserId, rolesMap['FEE_STAFF']]);
    await q(`INSERT INTO user_company_access (user_id, company_id) VALUES ($1, $2), ($1, $3)`, [feeStaffUserId, company1Id, company2Id]);

    // 9. Courses
    const course1Res = await q(
      `INSERT INTO courses (organization_id, company_id, name, code, description, category, duration_weeks, total_hours, base_fee, mode, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [orgId, company1Id, 'Full Stack Web & Cloud Architecture', 'CS-FS-101', 'Master enterprise JavaScript, React, Next.js, Node.js backend architecture, and cloud deployment pipelines.', 'Cloud & Software Engineering', 12, 140, 45000, 'classroom', 'active']
    );
    const course1Id = course1Res.rows[0].id;

    const course2Res = await q(
      `INSERT INTO courses (organization_id, company_id, name, code, description, category, duration_weeks, total_hours, base_fee, mode, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [orgId, company1Id, 'Applied AI & Machine Learning Engineering', 'AI-ML-201', 'Deep learning, predictive models, NLP, and production LLM orchestration.', 'Artificial Intelligence', 16, 180, 55000, 'hybrid', 'active']
    );
    const course2Id = course2Res.rows[0].id;

    const course3Res = await q(
      `INSERT INTO courses (organization_id, company_id, name, code, description, category, duration_weeks, total_hours, base_fee, mode, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [orgId, company2Id, 'Strategic Financial Management & Analytics', 'FIN-STRAT-301', 'Financial modeling, managerial accounting, valuation and automated corporate analytics.', 'Finance & Business', 8, 80, 35000, 'classroom', 'active']
    );
    const course3Id = course3Res.rows[0].id;

    // Course Modules & Lessons for Course 1
    const mod1Res = await q(
      `INSERT INTO course_modules (course_id, title, description, order_index)
       VALUES ($1, 'Module 1: Advanced Full Stack Architecture & REST APIs', 'Modern architecture patterns, SQL design, REST APIs, and authentication', 1)
       RETURNING id`,
      [course1Id]
    );
    const mod1Id = mod1Res.rows[0].id;

    await q(
      `INSERT INTO course_lessons (module_id, title, lesson_type, duration_mins, order_index, content_text)
       VALUES 
       ($1, '1.1 System Design Principles and Microservices vs Monoliths', 'text', 45, 1, 'Understanding separation of concerns, multi-tenant database isolation, and API gateway routing.'),
       ($1, '1.2 Relational Data Modeling & Parameterized SQL', 'text', 60, 2, 'Deep dive into indexes, foreign key cascades, transactions, and ACID properties.')`,
      [mod1Id]
    );

    // 10. Batches
    const batch1Res = await q(
      `INSERT INTO batches (organization_id, company_id, course_id, name, code, start_date, end_date, schedule_time, days_of_week, capacity, status)
       VALUES ($1, $2, $3, $4, $5, '2026-02-01', '2026-05-30', '09:30 AM - 01:30 PM', 'Mon,Tue,Wed,Thu,Fri', 35, 'active')
       RETURNING id`,
      [orgId, company1Id, course1Id, 'FS-2026-Batch-Alpha', 'BAT-AIT-01']
    );
    const batch1Id = batch1Res.rows[0].id;

    const batch2Res = await q(
      `INSERT INTO batches (organization_id, company_id, course_id, name, code, start_date, end_date, schedule_time, days_of_week, capacity, status)
       VALUES ($1, $2, $3, $4, $5, '2026-03-01', '2026-06-30', '02:00 PM - 06:00 PM', 'Mon,Tue,Wed,Thu,Fri', 30, 'active')
       RETURNING id`,
      [orgId, company2Id, course3Id, 'MGMT-2026-Batch-Gamma', 'BAT-ABM-01']
    );
    const batch2Id = batch2Res.rows[0].id;

    // Assign Trainer to Batch 1
    await q(`INSERT INTO batch_trainers (batch_id, trainer_id, is_primary) VALUES ($1, $2, true)`, [batch1Id, trainer1Id]);

    // Enroll Students into Batches
    await q(`INSERT INTO batch_students (batch_id, student_id) VALUES ($1, $2), ($1, $3)`, [batch1Id, student1Id, student2Id]);
    await q(`INSERT INTO batch_students (batch_id, student_id) VALUES ($1, $2)`, [batch2Id, student3Id]);

    // Enrollments
    await q(
      `INSERT INTO course_enrollments (organization_id, company_id, student_id, course_id, batch_id, completion_status)
       VALUES 
       ($1, $2, $3, $4, $5, 'in_progress'),
       ($1, $2, $6, $4, $5, 'completed'),
       ($1, $7, $8, $9, $10, 'in_progress')`,
      [orgId, company1Id, student1Id, course1Id, batch1Id, student2Id, company2Id, student3Id, course3Id, batch2Id]
    );

    // 11. Attendance Records & IP Match Alert Demo
    const today = new Date().toISOString().split('T')[0];
    
    // Rahul checks in from MG Road campus (lat 12.9716, lng 77.5946) with IP 203.0.113.45
    const att1Res = await q(
      `INSERT INTO attendance (organization_id, company_id, course_id, batch_id, student_id, date, check_in_time, latitude, longitude, gps_accuracy, server_ip, device_info, distance_meters, status, is_verified, is_flagged)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP - interval '2 hours', 12.9716000, 77.5946000, 8.5, '203.0.113.45', 'Chrome / macOS', 15.2, 'present', true, false)
       RETURNING id`,
      [orgId, company1Id, course1Id, batch1Id, student1Id, today]
    );
    const att1Id = att1Res.rows[0].id;

    // Kiran checks in 15 minutes later with the SAME public IP (203.0.113.45)
    const att2Res = await q(
      `INSERT INTO attendance (organization_id, company_id, course_id, batch_id, student_id, date, check_in_time, latitude, longitude, gps_accuracy, server_ip, device_info, distance_meters, status, is_verified, is_flagged, flag_reason)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP - interval '1 hour 45 minutes', 12.9715900, 77.5946100, 11.0, '203.0.113.45', 'Safari / iPhone 15', 18.4, 'present', true, true, 'IP Match with Student Rahul Sharma')
       RETURNING id`,
      [orgId, company1Id, course1Id, batch1Id, student2Id, today]
    );
    const att2Id = att2Res.rows[0].id;

    // Trigger Attendance IP Match Alert
    await q(
      `INSERT INTO attendance_ip_matches (organization_id, company_id, batch_id, date, ip_address, student_a_id, student_b_id, check_in_time_a, check_in_time_b, status, admin_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP - interval '2 hours', CURRENT_TIMESTAMP - interval '1 hour 45 minutes', 'pending', 'Flagged for coordinator review: shared public IP on check-in')`,
      [orgId, company1Id, batch1Id, today, '203.0.113.45', student1Id, student2Id]
    );

    // Attendance Override Sample Log
    await q(
      `INSERT INTO attendance_override_logs (attendance_id, previous_status, new_status, reason, remarks, modified_by)
       VALUES ($1, 'absent', 'present', 'Student reported medical clinic delay with valid doctor slip', 'Approved per academic coordinator guidelines', $2)`,
      [att1Id, orgAdminId]
    );

    // 12. Examinations
    const exam1Res = await q(
      `INSERT INTO examinations (organization_id, company_id, course_id, batch_id, name, code, description, exam_date, start_time, end_time, duration_minutes, total_marks, passing_marks, negative_marking_per_question, max_attempts, status, instructions, is_published)
       VALUES ($1, $2, $3, $4, 'Midterm Evaluation: Full Stack Architecture & REST APIs', 'EXAM-FS-01', 'Comprehensive midterm covering database design, REST endpoints, and security.', CURRENT_DATE, CURRENT_TIMESTAMP - interval '1 hour', CURRENT_TIMESTAMP + interval '5 hours', 60, 50, 20, 0.25, 1, 'ongoing', 'Select the best answers. Auto-submission will trigger when timer expires. Tab switching is logged.', true)
       RETURNING id`,
      [orgId, company1Id, course1Id, batch1Id]
    );
    const exam1Id = exam1Res.rows[0].id;

    // Assign Students to Exam
    await q(`INSERT INTO exam_assignments (exam_id, student_id) VALUES ($1, $2), ($1, $3)`, [exam1Id, student1Id, student2Id]);

    // Exam Questions
    const q1Res = await q(
      `INSERT INTO questions (exam_id, question_text, question_type, difficulty, marks, negative_marks, explanation, order_index)
       VALUES ($1, 'What is the primary advantage of parameterized SQL queries in enterprise applications?', 'mcq', 'medium', 5, 1.25, 'Parameterized queries separate SQL code from user inputs, preventing SQL injection vulnerabilities.', 1)
       RETURNING id`,
      [exam1Id]
    );
    const q1Id = q1Res.rows[0].id;
    await q(
      `INSERT INTO question_options (question_id, option_text, is_correct, order_index)
       VALUES 
       ($1, 'Automatic SQL injection prevention by separating query logic from data', true, 1),
       ($1, 'Faster disk I/O through in-memory cache indexing', false, 2),
       ($1, 'Allows bypass of primary key foreign constraints', false, 3),
       ($1, 'Encrypts the entire database table automatically', false, 4)`,
      [q1Id]
    );

    const q2Res = await q(
      `INSERT INTO questions (exam_id, question_text, question_type, difficulty, marks, negative_marks, explanation, order_index)
       VALUES ($1, 'In Next.js App Router, JWT tokens stored in HttpOnly cookies are immune to client-side XSS extraction.', 'true_false', 'easy', 5, 0, 'HttpOnly cookies cannot be read by document.cookie in JavaScript, blocking XSS token theft.', 2)
       RETURNING id`,
      [exam1Id]
    );
    const q2Id = q2Res.rows[0].id;
    await q(
      `INSERT INTO question_options (question_id, option_text, is_correct, order_index)
       VALUES 
       ($1, 'True', true, 1),
       ($1, 'False', false, 2)`,
      [q2Id]
    );

    const q3Res = await q(
      `INSERT INTO questions (exam_id, question_text, question_type, difficulty, marks, negative_marks, explanation, order_index)
       VALUES ($1, 'Which of the following are ACID properties in relational database management systems? (Select all that apply)', 'multi_select', 'medium', 10, 0, 'ACID stands for Atomicity, Consistency, Isolation, and Durability.', 3)
       RETURNING id`,
      [exam1Id]
    );
    const q3Id = q3Res.rows[0].id;
    await q(
      `INSERT INTO question_options (question_id, option_text, is_correct, order_index)
       VALUES 
       ($1, 'Atomicity', true, 1),
       ($1, 'Consistency', true, 2),
       ($1, 'Isolation', true, 3),
       ($1, 'Durability', true, 4),
       ($1, 'Asynchrony', false, 5)`,
      [q3Id]
    );

    // Completed Attempt for Student 2 (Kiran)
    const attemptRes = await q(
      `INSERT INTO exam_attempts (exam_id, student_id, attempt_number, start_time, submitted_at, time_spent_seconds, status, total_score, percentage, is_passed)
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP - interval '45 minutes', CURRENT_TIMESTAMP - interval '10 minutes', 2100, 'evaluated', 20, 100, true)
       RETURNING id`,
      [exam1Id, student2Id]
    );
    const attemptId = attemptRes.rows[0].id;

    await q(
      `INSERT INTO exam_results (exam_id, student_id, attempt_id, total_marks, marks_obtained, percentage, grade, status, is_published)
       VALUES ($1, $2, $3, 20, 20, 100, 'A+', 'passed', true)`,
      [exam1Id, student2Id, attemptId]
    );

    // 13. Certificate Templates & Issued Certificate
    const tmplRes = await q(
      `INSERT INTO certificate_templates (organization_id, company_id, name, title, signatory_name, signatory_title, is_active)
       VALUES ($1, $2, 'Executive Gold Standard Certificate', 'Certificate of Full Stack Engineering Distinction', 'Dr. Evelyn Vance', 'Academic Dean & Principal', true)
       RETURNING id`,
      [orgId, company1Id]
    );
    const tmplId = tmplRes.rows[0].id;

    // Issue certificate to Student 2 (Kiran Kumar)
    const certNumber = 'APEX-CERT-2026-98014';
    const certQrData = `https://apexlms.org/verify/${certNumber}`;
    await q(
      `INSERT INTO certificates (organization_id, company_id, student_id, course_id, exam_id, template_id, certificate_number, student_name, course_name, completion_date, issue_date, qr_code_data, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '2026-05-15', CURRENT_DATE, $10, 'valid')`,
      [orgId, company1Id, student2Id, course1Id, exam1Id, tmplId, certNumber, 'Kiran Kumar', 'Full Stack Web & Cloud Architecture', certQrData]
    );

    // 14. Fee Structures & Components
    const feeStructRes = await q(
      `INSERT INTO fee_structures (organization_id, company_id, course_id, batch_id, academic_year, name, total_fee, registration_fee, tuition_fee, exam_fee, material_fee, certification_fee, status)
       VALUES ($1, $2, $3, $4, '2026-2027', 'Standard Full Stack Professional Fee Structure', 45000, 5000, 30000, 3000, 4000, 3000, 'active')
       RETURNING id`,
      [orgId, company1Id, course1Id, batch1Id]
    );
    const feeStructId = feeStructRes.rows[0].id;

    await q(
      `INSERT INTO fee_components (fee_structure_id, name, amount, is_mandatory, is_discount_eligible)
       VALUES 
       ($1, 'Admission Registration Fee', 5000, true, false),
       ($1, 'Core Classroom & Lab Tuition', 30000, true, true),
       ($1, 'Laboratory Hardware & Digital Materials', 4000, true, true),
       ($1, 'Comprehensive Examination & Evaluation', 3000, true, false),
       ($1, 'Accredited Certification & Convocation Fee', 3000, true, false)`,
      [feeStructId]
    );

    // 15. Student Fee Accounts & Installments
    // Student 1 (Rahul Sharma): Total 45,000, Discount 5,000, Net 40,000. Paid 15,000, Outstanding 25,000. Partially Paid.
    const feeAcc1Res = await q(
      `INSERT INTO student_fee_accounts (organization_id, company_id, student_id, fee_structure_id, course_id, batch_id, base_fee, additional_charges, total_discount, net_payable, total_paid, outstanding_balance, status)
       VALUES ($1, $2, $3, $4, $5, $6, 45000, 0, 5000, 40000, 15000, 25000, 'partially_paid')
       RETURNING id`,
      [orgId, company1Id, student1Id, feeStructId, course1Id, batch1Id]
    );
    const feeAcc1Id = feeAcc1Res.rows[0].id;

    // 3 Installments for Rahul
    const inst1Res = await q(
      `INSERT INTO fee_installments (student_fee_account_id, installment_number, title, due_amount, due_date, paid_amount, status, paid_at)
       VALUES ($1, 1, 'Installment 1 (Registration & Advance)', 15000, '2026-02-05', 15000, 'paid', CURRENT_TIMESTAMP - interval '20 days')
       RETURNING id`,
      [feeAcc1Id]
    );
    const inst1Id = inst1Res.rows[0].id;

    await q(
      `INSERT INTO fee_installments (student_fee_account_id, installment_number, title, due_amount, due_date, paid_amount, status)
       VALUES 
       ($1, 2, 'Installment 2 (Mid-Term Lab & Tuition)', 15000, '2026-03-25', 0, 'pending'),
       ($1, 3, 'Installment 3 (Final Exam & Certification)', 10000, '2026-04-25', 0, 'pending')`,
      [feeAcc1Id]
    );

    // Payment Record & Receipt for Rahul Sharma
    const pay1Res = await q(
      `INSERT INTO fee_payments (organization_id, company_id, student_fee_account_id, student_id, payment_number, amount, payment_method, reference_number, remarks, collected_by, is_confirmed)
       VALUES ($1, $2, $3, $4, 'PAY-2026-0081', 15000, 'upi', 'UPI/2026/891238472', 'First installment paid via UPI QR', $5, true)
       RETURNING id`,
      [orgId, company1Id, feeAcc1Id, student1Id, feeStaffUserId]
    );
    const pay1Id = pay1Res.rows[0].id;

    await q(`INSERT INTO payment_allocations (payment_id, installment_id, allocated_amount) VALUES ($1, $2, 15000)`, [pay1Id, inst1Id]);

    const rcpt1Res = await q(
      `INSERT INTO payment_receipts (organization_id, company_id, payment_id, receipt_number, student_id, student_name, course_name, batch_name, amount, payment_method, previous_outstanding, current_outstanding, collector_name, remarks)
       VALUES ($1, $2, $3, 'RCPT-2026-00412', $4, 'Rahul Sharma', 'Full Stack Web & Cloud Architecture', 'FS-2026-Batch-Alpha', 15000, 'upi', 40000, 25000, 'Suresh Nair', 'First installment official digital receipt')
       RETURNING id`,
      [orgId, company1Id, pay1Id, student1Id]
    );
    await q(`UPDATE fee_payments SET receipt_id = $1 WHERE id = $2`, [rcpt1Res.rows[0].id, pay1Id]);

    // Student 2 (Kiran Kumar): Total 45,000, Net 45,000, Total Paid 45,000. Status 'paid'.
    const feeAcc2Res = await q(
      `INSERT INTO student_fee_accounts (organization_id, company_id, student_id, fee_structure_id, course_id, batch_id, base_fee, additional_charges, total_discount, net_payable, total_paid, outstanding_balance, status)
       VALUES ($1, $2, $3, $4, $5, $6, 45000, 0, 0, 45000, 45000, 0, 'paid')
       RETURNING id`,
      [orgId, company1Id, student2Id, feeStructId, course1Id, batch1Id]
    );
    const feeAcc2Id = feeAcc2Res.rows[0].id;

    await q(
      `INSERT INTO fee_installments (student_fee_account_id, installment_number, title, due_amount, due_date, paid_amount, status, paid_at)
       VALUES 
       ($1, 1, 'Full Payment Upfront', 45000, '2026-02-01', 45000, 'paid', CURRENT_TIMESTAMP - interval '30 days')`,
      [feeAcc2Id]
    );

    // Student 3 (Priya Menon): Total 35,000, Net 35,000, Paid 0, Outstanding 35,000. Status 'overdue'.
    const feeAcc3Res = await q(
      `INSERT INTO student_fee_accounts (organization_id, company_id, student_id, course_id, batch_id, base_fee, additional_charges, total_discount, net_payable, total_paid, outstanding_balance, status)
       VALUES ($1, $2, $3, $4, $5, 35000, 0, 0, 35000, 0, 35000, 'overdue')
       RETURNING id`,
      [orgId, company2Id, student3Id, course3Id, batch2Id]
    );
    const feeAcc3Id = feeAcc3Res.rows[0].id;

    await q(
      `INSERT INTO fee_installments (student_fee_account_id, installment_number, title, due_amount, due_date, paid_amount, status)
       VALUES 
       ($1, 1, 'Installment 1 (Overdue)', 20000, '2026-02-15', 0, 'overdue'),
       ($1, 2, 'Installment 2', 15000, '2026-03-30', 0, 'pending')`,
      [feeAcc3Id]
    );

    // 16. Fee Discount Approval Record
    await q(
      `INSERT INTO fee_discounts (organization_id, company_id, student_fee_account_id, discount_type, discount_value, calculated_amount, reason, status, approved_by)
       VALUES ($1, $2, $3, 'scholarship', 5000, 5000, 'Merit academic entrance exam scholarship', 'approved', $4)`,
      [orgId, company1Id, feeAcc1Id, orgAdminId]
    );

    // 17. Announcements
    await q(
      `INSERT INTO announcements (organization_id, company_id, title, content, target_role, priority)
       VALUES 
       ($1, $2, 'Midterm Examination Schedule Announcement', 'The Midterm evaluation for Full Stack Architecture is now live. Complete your test before end of window.', 'student', 'high'),
       ($1, $2, 'Location Check-in Notice', 'All learners must check-in within the designated 200m campus boundary using your mobile device GPS.', 'all', 'medium')`,
      [orgId, company1Id]
    );

    // 18. Notifications
    await q(
      `INSERT INTO notifications (user_id, title, message, type, link_url)
       VALUES 
       ($1, 'Welcome to Apex LMS', 'Your student account is active. Check your scheduled courses and batch details.', 'success', '/student/courses'),
       ($1, 'Fee Payment Received', 'Your payment of INR 15,000 for Receipt RCPT-2026-00412 has been recorded.', 'info', '/student/fees'),
       ($2, 'IP Match Alert Detected', 'Student Kiran Kumar checked in with an IP matching Student Rahul Sharma (203.0.113.45). Review required.', 'warning', '/admin/attendance/ip-matches')`,
      [student1UserId, orgAdminId]
    );

    console.log('✓ Successfully seeded demo organization, companies, users, courses, batches, exams, certificates and fee accounts!');
  });
}

// Allow direct CLI execution: node src/lib/db/seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeeds()
    .then(() => {
      console.log('Database seed finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database seed failed:', err);
      process.exit(1);
    });
}
