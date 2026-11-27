# Enterprise Learning Management System (LMS) & Fee Management Platform

A production-grade, multi-tenant **Enterprise Learning Management System (LMS)** with an integrated **Fee Management & Collection Desk**, built with **Next.js 14 (App Router)**, **Material UI (MUI v5)**, **PostgreSQL (Raw Parameterized SQL)**, and a **Blue & White Classy UI Design System**.

---

## 🏛️ System Architecture & Highlights

- **Multi-Tenant Hierarchy:** Single Parent Organization managing multiple subsidiary Companies (`organization_id`, `company_id` tenant isolation on every SQL query).
- **Dynamic 2D Permission Matrix UI:** Granular Role-Based Access Control spanning 20 modules × 8 actions (`Create`, `Read`, `Update`, `Delete`, `Approve`, `Override`, `Export`, `Print`).
- **Location-Based Attendance:** Browser Geolocation API coupled with **Server-Side Haversine Distance Validation** against approved campus GPS geofence radiuses (150m default).
- **IP Match Fraud Detection:** Identifies students checking in from the same public IP within a configurable time window; flags suspicious simultaneous check-ins for coordinator review without auto-rejecting.
- **Immutable Attendance Audit Trail:** Full historical override log capturing previous status, new status, admin attribution, and mandatory audit justification reasons.
- **Online Examination Engine:** Question bank with objective MCQs, timed test windows, real-time client countdown synchronized with server timestamps, automated grading, and instant performance analysis.
- **Verifiable Certificates:** Unique organization-wide certificate numbers, dynamic QR code generation, server-rendered landscape A4 PDF issuance (`pdf-lib`), and a mobile-first public verification portal at `/verify/[certNo]`.
- **Fee Management & Collection Desk:** Tiered fee structures, automated student fee ledger accounts, multi-tranche installments, on-the-spot fee collection desk with instant portrait A4 PDF receipts, discounts, refund adjustments, and 15 financial audit reports.
- **Three Dedicated Portals:**
  1. **Admin Portal:** Consolidated governance, batch scheduling, attendance overrides, IP match alerts, certificate issuance, and fee KPIs.
  2. **Student Portal:** Daily GPS check-in, course syllabus viewer, timed examinations, certificate showcase, and installment payment portal.
  3. **Trainer Portal:** Cohort rosters, batch attendance registers, learning material distribution, assignment scheduling, and performance analytics.

---

## 💻 Tech Stack (Strictly JavaScript & Raw SQL)

- **Frontend:** Next.js 14 (App Router), JavaScript (ES6+), Material UI (MUI v5), `@mui/icons-material`, `@mui/x-data-grid`, `@mui/x-date-pickers`, React Context API, Axios centralized API service layer, Recharts, Dayjs.
- **Backend:** Next.js Route Handlers (`route.js`), JWT authentication stored in secure `HttpOnly` cookies, centralized authorization middleware (`src/lib/api-response.js`).
- **Database:** PostgreSQL with **Raw Parameterized SQL** (Zero ORM, Zero Prisma). Embedded `@electric-sql/pglite` (WebAssembly PostgreSQL 16 engine persisting in `.pglite_data` for immediate zero-config execution) with automatic fallback to external `DATABASE_URL` via `pg.Pool`.
- **Document & Media Generation:** `pdf-lib` for vector PDF certificate and receipt rendering, `qrcode` for cryptographic QR code generation.

---

## 🎨 Blue & White Classy Design System

Enforced through `src/theme/theme.js` using a strict 8px grid (24px container padding, 24px card padding, 16px border-radius, soft shadows):
- **Primary Navy:** `#0B2A5B` (Sidebar, headings, primary hover)
- **Primary Blue:** `#1D4ED8` (Main brand actions, active states)
- **Bright Blue:** `#3B82F6` (Links, focus rings, chart accents)
- **Sky Tint:** `#EAF2FF` (Row hover tint, selected chips)
- **Ice Background:** `#F5F8FD` (Page background)
- **Pure White:** `#FFFFFF` (Surface cards, dialogs, tables)
- **Border:** `#E3EAF5` | **Text Primary:** `#0F1B33` | **Text Secondary:** `#5B6B88`

---

## 🚀 Quick Start Guide

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/lionelprudhvi-dev/lms.git
cd lms
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```
If using an external PostgreSQL instance, specify `DATABASE_URL` in `.env`. If omitted, the embedded WASM PostgreSQL engine (`@electric-sql/pglite`) runs automatically with local disk persistence in `.pglite_data`.

### 3. Database Migration & Seeding
Run schema migration (57 relational tables with UUID PKs, indexes, and constraints):
```bash
npm run db:migrate
```

Seed the database with organizations, companies, campus geofences, permission matrix, roles, demo users, courses, batches, attendance records, IP match alerts, exams, certificates, and fee ledgers:
```bash
npm run db:seed
```

### 4. Automated Verification Suite
Run the automated test suite verifying multi-tenancy, RBAC, Haversine calculations, IP match fraud detection, exam scoring, certificate generation, and fee balance arithmetic:
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Credentials

All seeded demo accounts share the password: **`Admin@123`**

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Organization Admin** | `admin@apexlms.com` | `Admin@123` | Full access across all companies, RBAC matrix, finances, overrides |
| **Company Admin** | `ait.admin@apexlms.com` | `Admin@123` | Admin access scoped to Apex Institute of Technology |
| **Trainer / Faculty** | `trainer.vikram@apexlms.com` | `Admin@123` | Assigned training batches, student roster, batch attendance, materials |
| **Student 1 (Rahul)** | `student.rahul@apexlms.com` | `Admin@123` | Student portal, GPS check-in, exams, certificates, fee installments |
| **Student 2 (Kiran)** | `student.kiran@apexlms.com` | `Admin@123` | Student portal (shares public IP alert with Rahul) |
| **Student 3 (Priya)** | `student.priya@apexlms.com` | `Admin@123` | Student portal (Apex Business & Management Academy) |
| **Fee Staff** | `fee.staff@apexlms.com` | `Admin@123` | Fee collection desk, instant receipts, installment tracking |

*Quick login buttons are available directly on the `/login` split-screen page.*

---

## 📁 Key Routes Map

### Admin Portal (`/admin/*`)
- `/admin/dashboard`: Organization-wide KPI metrics, attendance percentages, fee collection charts.
- `/admin/organization`: Multi-company hierarchy and tenant details.
- `/admin/rbac`: 2D Dynamic Permission Matrix (modules × actions) & custom role builder.
- `/admin/students` & `/admin/trainers`: Academic directories.
- `/admin/courses` & `/admin/batches`: Curriculum modules, chapters, and cohort scheduling.
- `/admin/attendance`: Daily attendance register.
- `/admin/attendance/locations`: Geofenced campus GPS coordinates and radius config.
- `/admin/attendance/ip-matches`: Public IP fraud detection review dashboard.
- `/admin/attendance/overrides`: Historical immutable attendance audit log.
- `/admin/exams` & `/admin/exams/questions`: Question bank and assessment setup.
- `/admin/certificates` & `/admin/certificates/templates`: Template designer, manual generation, and issued certificates log.
- `/admin/fees`: Financial KPI overview with Recharts analytics.
- `/admin/fees/collect`: Front-desk fee collection desk with instant A4 PDF receipts.
- `/admin/fees/structures`, `/admin/fees/installments`, `/admin/fees/discounts`, `/admin/fees/refunds`.
- `/admin/reports`: Consolidated audit reports export (Excel, CSV, PDF).
- `/admin/announcements`: Broadcast manager for campus notices.
- `/admin/settings`: Geofence radius, IP fraud detection window, and unpaid fee restriction rules.

### Student Portal (`/student/*`)
- `/student/dashboard`: Enrolled courses, attendance status, upcoming exams, fee balance overview.
- `/student/courses`: Expandable course syllabus with lessons, video links, and notes.
- `/student/attendance`: Geolocation check-in/check-out with real-time distance indicator.
- `/student/exams`: Assessment list & `/student/exams/[id]/take` timed interactive examination room.
- `/student/results`: Exam attempt review, score card, and percentage.
- `/student/certificates`: Issued certificates with PDF download and verification link.
- `/student/fees`: Itemized installments, paid amounts, balance dues, and payment simulator.
- `/student/announcements` & `/student/profile`.

### Trainer Portal (`/trainer/*`)
- `/trainer/dashboard`: Active training cohorts and daily session schedule.
- `/trainer/batches` & `/trainer/students`: Roster and cohort progression.
- `/trainer/attendance`: Batch attendance register with Present / Late / Absent toggles.
- `/trainer/materials`: Course notes and video lectures upload.
- `/trainer/assignments`: Assessment scheduling and submission deadlines.
- `/trainer/performance`: Pass rate distribution and module mastery analytics.

### Public Pages
- `/`: Classy landing page.
- `/login`: Split-screen branded authentication panel with demo credentials.
- `/verify/[certNo]`: Mobile-first cryptographic certificate verification page.

---

## 🔒 Security & Data Integrity

- **Tenant Isolation:** Enforced on every backend API route via `authorizeRequest(req, { permission, companyScoped })`.
- **Tamper-Resistant Geofencing:** Client coordinates validated against approved campus locations via spherical Haversine distance on the server.
- **Server-Observed IP:** Client-supplied headers are strictly validated against trusted reverse proxy rules to prevent spoofing.
- **Audit Trails:** Critical actions (attendance overrides, discount approvals, refund adjustments) produce immutable timestamped audit entries.
- **Password Security:** Salted `bcryptjs` hashing with parameterized SQL statements preventing SQL injection.

---

## 📜 Production Build Status

- **Routes Compiled:** 88 / 88 pages & API routes.
- **Build Command:** `npm run build`
- **Static Page Generation:** Clean pass (`✓ Generating static pages (88/88)`).
- **Test Suite:** 23 / 23 unit & integration tests passing (`npm test`).
