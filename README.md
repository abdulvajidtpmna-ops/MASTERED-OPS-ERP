# MLC ERP — Mastered Language Coach / Mastered Skill Academy

**MLC ERP** is a complete, production-ready Enterprise Resource Planning platform engineered for **Mastered Language Coach / Mastered Skill Academy**, a premier professional training institute in Kerala.

---

## 🌟 1. Architecture Overview

- **Frontend**: React 18, Vite, Tailwind CSS (Shiny Blue `#061B4D` & Shiny Gold `#F5B921`), React Router, TanStack Query, Recharts, Lucide Icons, and PWA (Service Worker + Web App Manifest).
- **Backend**: Google Apps Script Web App (`Code.gs` + modules) with a single `doPost(e)` entry point accepting `Content-Type: text/plain` JSON payloads to bypass CORS preflights.
- **Database**: Single Google Spreadsheet (37+ frozen tabs with audit columns `id, created_at, created_by, updated_at, updated_by, is_deleted`).
- **File Storage**: Google Drive folders for signed agreements, PDF fee receipts, and evidence artifacts.
- **Email Engine**: GmailApp with branded responsive HTML templates, PDF attachments, and complete delivery logging into `EmailLog`.

---

## 📂 2. Project Directory Structure

```
MASTERED OPS ERP/
├── apps-script/                 # Google Apps Script Backend Modules
│   ├── appsscript.json          # Apps Script Manifest (Asia/Kolkata timezone)
│   ├── Code.gs                  # Main Web App Router & Action Dispatcher
│   ├── Utils.gs                 # Batch DB Readers, Idempotency, SHA-256 Hashing, Formula Sanitizer
│   ├── Auth.gs                  # Salted Hashes, 12h Session Tokens, 5-Attempt Lockout
│   ├── Seed.gs                  # 37+ Tab Schema Generator & Full Curriculum Seed
│   ├── Admissions.gs            # ScriptLock Auto-Numbering (ON/OF-YYYY-XXXX), Auto-Login, FeePlan
│   ├── Batches.gs               # After-Sales Logging, Cohort Scheduler, 4-Installment Auto-Generator
│   ├── Attendance.gs            # Trainer Verification, 7-Day Window, 85% Shortfall Calculator
│   ├── Assessments.gs           # Multi-Component Weighted Scoring & Letter Grade Bands
│   ├── Fees.gs                  # Payment Recording, Vouchers, Postponement Governance
│   ├── Agreements.gs            # Signed Sheet Image-to-PDF Conversion & Drive Archival
│   ├── Placement.gs             # Double-Confirmed Preferences, 1-Click Call Letters, Analytics
│   ├── Duties.gs                # Daily Checklists, Evidence Validation, HR 1-5 Star Reviews, KPIs
│   ├── Notes.gs                 # Central Notes Repository & Batch Assignment
│   ├── Chat.gs                  # Real-Time Batch Community Discussion Room
│   ├── Emails.gs                # Shiny Blue/Gold HTML Responsive Templates
│   ├── Triggers.gs              # 08:00 AM Cron (Reminders, Overdue, Duties Instantiation)
│   ├── Backup.gs                # Daily 02:00 AM Automated Backup & 14-Day Retention
│   └── Tests.gs                 # Server-Side Business Logic Unit Test Suite
│
├── frontend/                    # Modern React 18 + Vite Web Application & PWA
│   ├── public/                  # Manifest, Service Worker, Brand SVGs
│   ├── src/
│   │   ├── api/                 # API Client with Google Apps Script + Offline Mock Engine
│   │   ├── context/             # AuthContext (with 1-Click Role Switcher) & ToastContext
│   │   ├── components/          # Reusable UI (Cards, StatCards, Badges, Modals, Tables, Buttons)
│   │   ├── pages/               # 14 Full Responsive Screens
│   │   │   ├── Login.jsx
│   │   │   ├── MainAdminDashboard.jsx
│   │   │   ├── OpsAdminDashboard.jsx
│   │   │   ├── AdmissionsPage.jsx
│   │   │   ├── AfterSalesPage.jsx
│   │   │   ├── BatchesPage.jsx
│   │   │   ├── FeeCollectionPage.jsx
│   │   │   ├── AgreementsPage.jsx
│   │   │   ├── PlacementTrackerPage.jsx
│   │   │   ├── TrainerConsolePage.jsx
│   │   │   ├── StudentPortalPage.jsx
│   │   │   ├── DutiesPage.jsx
│   │   │   ├── HRReviewPage.jsx
│   │   │   └── AdminSettingsPage.jsx
│   │   ├── tests/               # Frontend Vitest Business Logic Tests
│   │   ├── App.jsx              # Role-Based Routing & Security Guards
│   │   └── main.jsx
│   ├── tailwind.config.js       # Shiny Blue & Shiny Gold Brand Design Tokens
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🚀 3. Step-by-Step Deployment Guide

### Step 1: Create Google Spreadsheet & Apps Script Project
1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet named `MLC_ERP_Database`.
2. Note the **Spreadsheet ID** from the URL (`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`).
3. Click **Extensions ➔ Apps Script**.
4. Copy all `.gs` files and `appsscript.json` from the `/apps-script` folder into your Apps Script editor.

### Step 2: Configure Script Properties
In the Apps Script Editor, go to **Project Settings (⚙️) ➔ Script Properties** and add:
- `SPREADSHEET_ID`: `<Your Google Spreadsheet ID>`
- `DRIVE_ROOT_ID`: `<Optional Google Drive Folder ID for Backups & Agreements>`
- `HASH_PEPPER`: `MLC_ERP_SECRET_PEPPER_2026`
- `INSTITUTE_NAME`: `Mastered Language Coach / Mastered Skill Academy`
- `SENDER_NAME`: `Mastered Skill Academy Admissions & Operations`

### Step 3: Run Database Seed & Verification
1. In the Apps Script editor, select function `seedDatabase` and click **Run**.
   - This automatically creates all **37+ tabs** with frozen dark-blue header rows.
   - Seeds the full **HRCA (6 modules / 117 hrs)** and **BHA (13 modules / 187 hrs)** curriculum.
   - Populates initial accounts (Main Admin, Ops Admin, Placement Admin, Trainers, Staff).
2. Select function `runAllServerTests` and click **Run** to execute the server-side test suite.

### Step 4: Configure Automated Daily Triggers
In the Apps Script editor, select function `setupDailyTriggers` and click **Run**.
- Configures **08:00 AM Daily Trigger**: Dispatches fee reminders (-3 days, due date, +2 days overdue), marks yesterday's pending duties as missed, and generates today's daily duties from templates.
- Configures **02:00 AM Daily Trigger**: Copies the spreadsheet database to `/Backups` in Google Drive, automatically retaining the last 14 copies.

### Step 5: Deploy Apps Script as Web App
1. In the top right, click **Deploy ➔ New deployment**.
2. Select **Web app**.
3. Set configuration:
   - **Description**: `MLC ERP Production v2.0`
   - **Execute as**: `Me (<your-email>)`
   - **Who has access**: `Anyone`
4. Click **Deploy** and copy the **Web App URL** (`https://script.google.com/macros/s/.../exec`).

### Step 6: Configure and Run Frontend
1. Open `frontend/.env` and set:
   ```env
   VITE_API_URL=https://script.google.com/macros/s/<YOUR_DEPLOYMENT_ID>/exec
   ```
   *(Note: If `VITE_API_URL` is left empty, the frontend automatically runs in high-fidelity local interactive mock mode).*
2. Install dependencies & launch:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Run frontend unit tests:
   ```bash
   npm run test
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---

## 👥 4. Pre-Configured Test Credentials

| Role | Email / ID | Default Password | Description |
| :--- | :--- | :--- | :--- |
| **MAIN_ADMIN** | `admin@mastered.in` | `Mastered@2026` | Master Executive Dashboard & Settings |
| **OPS_ADMIN** | `ops@mastered.in` | `Mastered@2026` | Operations Control & Postponement Approval |
| **OPS_EXEC** | `opsexec@mastered.in` | `Mastered@2026` | After-Sales Calls & Batch Assignment |
| **OFFICE_ADMIN** | `office@mastered.in` | `Mastered@2026` | Fee Collection & Agreement Processing |
| **PLACEMENT_ADMIN** | `placement@mastered.in` | `Mastered@2026` | Preferences, Interviews & Offers |
| **HR** | `hr@mastered.in` | `Mastered@2026` | Staff Duty Audits & 1-5 Star Reviews |
| **STAFF (Sales)** | `sales1@mastered.in` | `Mastered@2026` | Admissions Registration |
| **TRAINER** | `vajid@mastered.in` | `TR-101` | Session Attendance & Marks |
| **STUDENT** | `9847123456` | `ON-2026-0001` | Attendance Gauge, Marks & Notes |

*(The login screen also includes an instant 1-Click Role Switcher for seamless evaluation).*

---

## 🛡️ 5. Key Business Rules Enforced

1. **Lock-Protected Auto-Numbering**: Online (`ON-YYYY-0001`) and Offline (`OF-YYYY-0001`) counters use `LockService.getScriptLock()` to guarantee zero duplicate admission numbers.
2. **Automated Fee Schedule**: Batch start triggers ₹2,450 balance-registration due on start date and 4 course installments (+7, +37, +67, +97 days) with remainder absorbed by the 4th installment.
3. **Attendance Eligibility Guard**: Students require both **overall ≥ 85%** AND **every module ≥ 85%** to achieve placement eligibility.
4. **Assessment Re-Normalization**: Missing test/presentation/mock components dynamically re-normalize module weights before computing overall hours-weighted scores.
5. **Preference Workflow Sequence**: Training agreements must be processed and emailed *before* candidate career preferences and professional email verification are logged.
6. **Double-Confirmed Email**: Placement preferences require typing the candidate's professional email twice to avoid missed recruiter calls.
