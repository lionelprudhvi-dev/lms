-- Enterprise LMS Complete Schema
-- Pure PostgreSQL raw SQL

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  logo_url TEXT,
  website VARCHAR(255),
  address TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Organization Settings
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  currency VARCHAR(10) DEFAULT 'INR',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  academic_year VARCHAR(20) DEFAULT '2026-2027',
  attendance_geofence_default INT DEFAULT 150,
  ip_matching_scope VARCHAR(50) DEFAULT 'company', -- 'company' | 'batch' | 'organization'
  ip_matching_window_minutes INT DEFAULT 60,
  razorpay_key_id VARCHAR(255),
  razorpay_key_secret VARCHAR(255),
  rules JSONB DEFAULT '{"block_materials_on_unpaid": true, "block_exams_on_unpaid": true, "block_certificate_on_unpaid": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  logo_url TEXT,
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  gstin VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, code)
);

-- 4. Company Approved Geofenced Locations
CREATE TABLE IF NOT EXISTS company_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  radius_meters INT DEFAULT 150,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  user_type VARCHAR(50) NOT NULL DEFAULT 'student', -- 'admin', 'company_admin', 'trainer', 'student', 'staff'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, code)
);

-- 7. Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL, -- create, read, update, delete, approve, override, export, print
  code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

-- 8. Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

-- 9. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);

-- 10. User Company Access
CREATE TABLE IF NOT EXISTS user_company_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, company_id)
);

-- 11. Students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id_code VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  dob DATE,
  gender VARCHAR(20),
  address TEXT,
  qualification VARCHAR(100),
  emergency_contact VARCHAR(100),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'completed', 'suspended'
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Trainers
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  trainer_id_code VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  qualification VARCHAR(100),
  skills TEXT,
  experience_years NUMERIC(4, 1),
  joining_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active',
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Technology',
  thumbnail_url TEXT,
  duration_weeks INT DEFAULT 12,
  total_hours INT DEFAULT 120,
  base_fee NUMERIC(12, 2) DEFAULT 0,
  mode VARCHAR(50) DEFAULT 'classroom', -- 'classroom', 'online', 'hybrid'
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, code)
);

-- 14. Course Modules
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. Course Lessons
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  lesson_type VARCHAR(50) DEFAULT 'video', -- 'video', 'pdf', 'text', 'assignment'
  content_url TEXT,
  content_text TEXT,
  duration_mins INT DEFAULT 30,
  order_index INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. Batches
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  schedule_time VARCHAR(100) DEFAULT '09:30 AM - 01:30 PM',
  days_of_week VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
  capacity INT DEFAULT 30,
  status VARCHAR(20) DEFAULT 'active', -- 'upcoming', 'active', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, code)
);

-- 17. Batch Students
CREATE TABLE IF NOT EXISTS batch_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batch_id, student_id)
);

-- 18. Batch Trainers
CREATE TABLE IF NOT EXISTS batch_trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batch_id, trainer_id)
);

-- 19. Course Enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  completion_status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'dropped'
  completion_date DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id)
);

-- 20. Learning Materials
CREATE TABLE IF NOT EXISTS learning_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  file_url TEXT,
  file_type VARCHAR(50) DEFAULT 'pdf',
  file_size INT DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 21. Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  gps_accuracy NUMERIC(8, 2),
  server_ip VARCHAR(64),
  device_info VARCHAR(255),
  device_id VARCHAR(100),
  distance_meters NUMERIC(10, 2),
  status VARCHAR(20) DEFAULT 'present', -- 'present', 'absent', 'late', 'half_day', 'holiday'
  is_verified BOOLEAN DEFAULT true,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, date)
);

-- 22. Attendance Location Logs
CREATE TABLE IF NOT EXISTS attendance_location_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  raw_lat NUMERIC(10, 7),
  raw_lng NUMERIC(10, 7),
  accuracy NUMERIC(8, 2),
  matched_location_id UUID REFERENCES company_locations(id) ON DELETE SET NULL,
  calculated_distance NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 23. Attendance IP Logs
CREATE TABLE IF NOT EXISTS attendance_ip_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  ip_address VARCHAR(64) NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 24. Attendance IP Matches (Alerts)
CREATE TABLE IF NOT EXISTS attendance_ip_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  ip_address VARCHAR(64) NOT NULL,
  student_a_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_b_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  check_in_time_a TIMESTAMPTZ,
  check_in_time_b TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed', 'confirmed'
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 25. Attendance Override Logs (Immutable Audit)
CREATE TABLE IF NOT EXISTS attendance_override_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  previous_check_in TIMESTAMPTZ,
  new_check_in TIMESTAMPTZ,
  reason TEXT NOT NULL,
  remarks TEXT,
  modified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 26. Attendance Policies
CREATE TABLE IF NOT EXISTS attendance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  late_grace_minutes INT DEFAULT 15,
  half_day_hours INT DEFAULT 4,
  min_hours_full_day INT DEFAULT 7,
  require_geofence BOOLEAN DEFAULT true,
  geofence_radius_meters INT DEFAULT 150,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id)
);

-- 27. Holidays
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 28. Examinations
CREATE TABLE IF NOT EXISTS examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  exam_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  total_marks INT DEFAULT 100,
  passing_marks INT DEFAULT 40,
  negative_marking_per_question NUMERIC(4, 2) DEFAULT 0,
  max_attempts INT DEFAULT 1,
  status VARCHAR(30) DEFAULT 'scheduled', -- 'draft', 'scheduled', 'ongoing', 'completed', 'cancelled'
  instructions TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, code)
);

-- 29. Exam Assignments
CREATE TABLE IF NOT EXISTS exam_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, student_id)
);

-- 30. Question Banks
CREATE TABLE IF NOT EXISTS question_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 31. Questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_bank_id UUID REFERENCES question_banks(id) ON DELETE SET NULL,
  exam_id UUID REFERENCES examinations(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'mcq', -- 'mcq', 'multi_select', 'true_false', 'fill_blanks', 'short', 'long'
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  marks INT DEFAULT 1,
  negative_marks NUMERIC(4, 2) DEFAULT 0,
  explanation TEXT,
  order_index INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 32. Question Options
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INT DEFAULT 1
);

-- 33. Exam Attempts
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attempt_number INT DEFAULT 1,
  start_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'in_progress', -- 'in_progress', 'submitted', 'evaluated'
  total_score NUMERIC(6, 2) DEFAULT 0,
  percentage NUMERIC(5, 2) DEFAULT 0,
  is_passed BOOLEAN DEFAULT false,
  tab_switches_count INT DEFAULT 0,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, student_id, attempt_number)
);

-- 34. Exam Answers
CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  marks_awarded NUMERIC(5, 2) DEFAULT 0,
  evaluator_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(attempt_id, question_id)
);

-- 35. Exam Results
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE SET NULL,
  total_marks INT NOT NULL,
  marks_obtained NUMERIC(6, 2) NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL,
  grade VARCHAR(10),
  status VARCHAR(20) NOT NULL, -- 'passed', 'failed'
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, student_id)
);

-- 36. Certificate Templates
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) DEFAULT 'Certificate of Completion',
  background_color VARCHAR(50) DEFAULT '#FFFFFF',
  border_style VARCHAR(50) DEFAULT 'solid',
  primary_color VARCHAR(50) DEFAULT '#0B2A5B',
  secondary_color VARCHAR(50) DEFAULT '#1D4ED8',
  header_text TEXT DEFAULT 'This is proudly presented to',
  body_template TEXT DEFAULT 'for outstandingly and successfully completing the course requirements and practical assessments.',
  footer_text TEXT DEFAULT 'Issued with pride and high distinction.',
  signatory_name VARCHAR(100) DEFAULT 'Dr. Evelyn Vance',
  signatory_title VARCHAR(100) DEFAULT 'Academic Director',
  signature_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 37. Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES examinations(id) ON DELETE SET NULL,
  template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL,
  certificate_number VARCHAR(100) NOT NULL UNIQUE,
  student_name VARCHAR(255) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  completion_date DATE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  qr_code_data TEXT,
  status VARCHAR(20) DEFAULT 'valid', -- 'valid', 'revoked'
  revoked_reason TEXT,
  revoked_at TIMESTAMPTZ,
  version INT DEFAULT 1,
  previous_certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 38. Certificate Verification Logs
CREATE TABLE IF NOT EXISTS certificate_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
  certificate_number VARCHAR(100) NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(64),
  user_agent TEXT,
  is_valid BOOLEAN DEFAULT true
);

-- 39. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target_role VARCHAR(50) DEFAULT 'all',
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 40. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  link_url VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 41. Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT DEFAULT 0,
  mime_type VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 42. Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 43. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 44. Fee Structures
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  academic_year VARCHAR(50) DEFAULT '2026-2027',
  name VARCHAR(255) NOT NULL,
  total_fee NUMERIC(12, 2) NOT NULL,
  registration_fee NUMERIC(12, 2) DEFAULT 0,
  tuition_fee NUMERIC(12, 2) DEFAULT 0,
  exam_fee NUMERIC(12, 2) DEFAULT 0,
  material_fee NUMERIC(12, 2) DEFAULT 0,
  certification_fee NUMERIC(12, 2) DEFAULT 0,
  other_charges NUMERIC(12, 2) DEFAULT 0,
  tax_percentage NUMERIC(5, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 45. Fee Components
CREATE TABLE IF NOT EXISTS fee_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  is_discount_eligible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 46. Student Fee Accounts
CREATE TABLE IF NOT EXISTS student_fee_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  base_fee NUMERIC(12, 2) NOT NULL,
  additional_charges NUMERIC(12, 2) DEFAULT 0,
  total_discount NUMERIC(12, 2) DEFAULT 0,
  net_payable NUMERIC(12, 2) NOT NULL,
  total_paid NUMERIC(12, 2) DEFAULT 0,
  outstanding_balance NUMERIC(12, 2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 47. Student Fee Adjustments
CREATE TABLE IF NOT EXISTS student_fee_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_fee_account_id UUID NOT NULL REFERENCES student_fee_accounts(id) ON DELETE CASCADE,
  adjustment_type VARCHAR(50) NOT NULL, -- 'addition', 'deduction', 'waiver'
  amount NUMERIC(12, 2) NOT NULL,
  reason TEXT NOT NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 48. Fee Installments
CREATE TABLE IF NOT EXISTS fee_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_fee_account_id UUID NOT NULL REFERENCES student_fee_accounts(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  due_amount NUMERIC(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_amount NUMERIC(12, 2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'partially_paid', 'paid', 'overdue'
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_fee_account_id, installment_number)
);

-- 49. Fee Payments
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_fee_account_id UUID NOT NULL REFERENCES student_fee_accounts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_number VARCHAR(100) NOT NULL UNIQUE,
  payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'cash', 'upi', 'bank_transfer', 'neft_rtgs', 'cheque', 'card', 'payment_gateway', 'other'
  reference_number VARCHAR(100),
  cheque_number VARCHAR(100),
  cheque_date DATE,
  bank_name VARCHAR(100),
  remarks TEXT,
  collected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  receipt_id UUID,
  is_confirmed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 50. Payment Allocations
CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES fee_payments(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES fee_installments(id) ON DELETE SET NULL,
  allocated_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 51. Payment Receipts
CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES fee_payments(id) ON DELETE CASCADE UNIQUE,
  receipt_number VARCHAR(100) NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  course_name VARCHAR(255),
  batch_name VARCHAR(255),
  payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  previous_outstanding NUMERIC(12, 2) NOT NULL,
  current_outstanding NUMERIC(12, 2) NOT NULL,
  remarks TEXT,
  collector_name VARCHAR(100),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 52. Fee Discounts & Concessions
CREATE TABLE IF NOT EXISTS fee_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_fee_account_id UUID NOT NULL REFERENCES student_fee_accounts(id) ON DELETE CASCADE,
  discount_type VARCHAR(50) NOT NULL, -- 'fixed', 'percentage', 'scholarship', 'promotional', 'management_concession'
  discount_value NUMERIC(12, 2) NOT NULL,
  calculated_amount NUMERIC(12, 2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 53. Discount Approvals
CREATE TABLE IF NOT EXISTS discount_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES fee_discounts(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL, -- 'approved', 'rejected'
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 54. Fee Refunds & Cancellations
CREATE TABLE IF NOT EXISTS fee_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES fee_payments(id) ON DELETE CASCADE,
  student_fee_account_id UUID NOT NULL REFERENCES student_fee_accounts(id) ON DELETE CASCADE,
  refund_number VARCHAR(100) NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL,
  refund_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  reason TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'approved', -- 'pending', 'approved', 'processed', 'rejected'
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 55. Payment Gateway Transactions (Razorpay etc.)
CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_fee_account_id UUID NOT NULL REFERENCES student_fee_accounts(id) ON DELETE CASCADE,
  gateway_order_id VARCHAR(100) NOT NULL,
  gateway_payment_id VARCHAR(100),
  gateway_signature VARCHAR(255),
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(30) DEFAULT 'created', -- 'created', 'authorized', 'captured', 'failed'
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 56. Payment Gateway Webhook Logs
CREATE TABLE IF NOT EXISTS payment_gateway_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(100) NOT NULL,
  event_payload JSONB NOT NULL,
  signature VARCHAR(255),
  is_verified BOOLEAN DEFAULT true,
  processed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 57. Fee Reminders
CREATE TABLE IF NOT EXISTS fee_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_fee_account_id UUID NOT NULL REFERENCES student_fee_accounts(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES fee_installments(id) ON DELETE SET NULL,
  reminder_type VARCHAR(50) NOT NULL, -- 'upcoming', 'due_today', 'overdue'
  channel VARCHAR(50) DEFAULT 'in_app', -- 'in_app', 'email', 'sms', 'whatsapp'
  status VARCHAR(30) DEFAULT 'sent',
  scheduled_date DATE DEFAULT CURRENT_DATE,
  sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_org ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_comp ON students(company_id);
CREATE INDEX IF NOT EXISTS idx_trainers_comp ON trainers(company_id);
CREATE INDEX IF NOT EXISTS idx_courses_comp ON courses(company_id);
CREATE INDEX IF NOT EXISTS idx_batches_comp ON batches(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_comp_date ON attendance(company_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_ip ON attendance(server_ip);
CREATE INDEX IF NOT EXISTS idx_ip_matches_date ON attendance_ip_matches(date);
CREATE INDEX IF NOT EXISTS idx_exams_comp ON examinations(company_id);
CREATE INDEX IF NOT EXISTS idx_certs_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certs_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_accounts_student ON student_fee_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_account ON fee_payments(student_fee_account_id);
CREATE INDEX IF NOT EXISTS idx_fee_installments_account ON fee_installments(student_fee_account_id);
