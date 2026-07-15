# Comprehensive E-RPH (Daily Lesson Plan) Application Guidelines for Supabase Integration

This document outlines the complete architectural roadmap and development guidelines for the school's E-RPH (Rancangan Pengajaran Harian) application, utilizing Supabase as the core Backend-as-a-Service (BaaS). This version incorporates critical project management and technical refinements to address operational loopholes, ensuring scalability, data integrity, and compliance with the Malaysian Ministry of Education (KPM) standards.

---

## 1. Application Workflow & User Journey

### A. Teacher (Cikgu) Workflow
1. **Authentication:** Teachers log in using secure credentials managed via Supabase Auth.
2. **Dashboard & Planning:** Teachers view their schedule and initiate a new RPH draft.
3. **Drafting (Save for Later):** Teachers can create and save an incomplete RPH using the `Draft` status, allowing them to resume later without forcing submission.
4. **Form Submission:** Teachers fill out the RPH form based on standardized dropdowns (Master Data) and submit it for review. The status updates to `Pending`.
5. **Revisions (Edit & Resubmit):** If an RPH is marked as `Not Approved` by a reviewer, the teacher can view remarks, edit the existing submission, and resubmit it (triggering a version update in the audit trail).

### B. Reviewer & Administrator Workflow
1. **Tiered Approval System:** Addressing the reviewer bottleneck, the workflow supports multiple tiers of review (e.g., Head of Department/Ketua Panitia -> Senior Assistant/Penolong Kanan -> Principal/Pengetua).
2. **Real-time Queue:** Reviewers access a dashboard displaying `Pending` submissions relevant to their assigned department or tier.
3. **Action & Remarks:** Reviewers can `Approve` or `Reject` (Not Approve). Rejections mandate explanatory remarks for the teacher.
4. **System Administration (Super Admin):** A dedicated Super Admin role manages Master Data (Subjects, Classes), school settings (Logo), and user role assignments to prevent role exploitation.
5. **PDF Export:** Reviewers or administrators can export approved RPH documents into standardized, non-editable PDF formats featuring the uploaded school logo.

---

## 2. Refined Database Schema (Supabase SQL)

The database schema has been restructured to enforce data normalization, prevent time clashes, and maintain a robust audit trail. Execute the following SQL scripts in the Supabase SQL Editor.

### Table 1: `profiles`
Manages user identities and strict role-based access.

```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text check (role in ('teacher', 'reviewer', 'admin')) default 'teacher',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
-- Note: RLS policies must explicitly forbid users from updating their own 'role'.
```

### Table 2: `master_subjects` & Table 3: `master_classes`
Master data tables to prevent inconsistent text entries.

```sql
create table public.master_subjects (
  id uuid default gen_random_uuid() primary key,
  subject_code text unique not null,
  subject_name text not null,
  is_active boolean default true
);

create table public.master_classes (
  id uuid default gen_random_uuid() primary key,
  academic_year varchar(15) not null, -- e.g., 'Tahun 1', 'Tingkatan 4'
  class_name text not null,           -- e.g., '1 Arif', '4 Sains'
  is_active boolean default true
);
```

### Table 4: `rph_submissions`
The primary table for lesson plans, now including KPM-mandated fields and soft-delete capabilities.

```sql
create table public.rph_submissions (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid references public.master_subjects(id) not null,
  class_id uuid references public.master_classes(id) not null,
  lesson_date date not null,
  start_time time not null,
  end_time time not null,
  school_week int not null,           -- e.g., Week 1, Week 12
  content_standard text not null,     -- Standard Kandungan (KPM requirement)
  learning_standard text not null,    -- Standard Pembelajaran (KPM requirement)
  objectives text not null,
  activities text not null,
  teaching_aids text,                 -- BBM (Bahan Bantu Mengajar)
  cross_curricular_elements text,     -- EMK (Elemen Merentas Kurikulum)
  reflection text,
  status text check (status in ('Draft', 'Pending', 'Approved', 'Not Approved')) default 'Draft',
  reviewer_remarks text,
  is_deleted boolean default false,   -- Soft delete functionality
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.rph_submissions enable row level security;
```

### Table 5: `rph_history` (Version Control & Audit Trail)
Captures historical data to track changes upon resubmission.

```sql
create table public.rph_history (
  id uuid default gen_random_uuid() primary key,
  rph_id uuid references public.rph_submissions(id) on delete cascade not null,
  action_by uuid references public.profiles(id) not null,
  status_changed_to text not null,
  remarks text,
  previous_data_snapshot jsonb,       -- Stores a snapshot of the RPH data before edits
  action_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.rph_history enable row level security;
```

### Table 6: `school_settings`
```sql
create table public.school_settings (
  id int primary key default 1,
  school_name text not null,
  logo_url text, 
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint one_row check (id = 1)
);
```

---

## 3. Development Guidelines & Essential Logic Constraints

### A. Time Clash Prevention Logic (Backend/Edge Function)
Before processing an `INSERT` or `UPDATE` for an RPH, the system must validate that the teacher does not have another active RPH scheduled during the same time block on the same date.
*   **Logic:** Query `rph_submissions` where `teacher_id` matches, `lesson_date` matches, and the new time block overlaps with existing `start_time` and `end_time`. If an overlap exists, abort the transaction and return an error to the frontend.

### B. Master Data Enforcement
Frontend forms must fetch Subjects and Classes exclusively from `master_subjects` and `master_classes`. Direct text inputs for these fields are strictly prohibited to ensure reporting accuracy.

### C. Scalable Admin Dashboard (Pagination & Lazy Loading)
To prevent browser freezing and excessive API calls as data grows:
*   Frontend data tables must implement pagination using Supabase's `range()` modifier.
*   Example: `.range((page - 1) * limit, (page * limit) - 1)`
*   Filters (Subject, Class, Teacher Name, Date Range) must append dynamically to the query before execution.

### D. Soft Delete Implementation
Teachers cannot permanently delete records from the database.
*   Deleting an RPH via the UI simply triggers an `UPDATE` setting `is_deleted = true`.
*   All `SELECT` queries across the application must include `.eq('is_deleted', false)` to exclude these records from active views.

### E. Security & Role Management
*   **Registration:** New sign-ups default to the `teacher` role.
*   **Privilege Escalation:** RLS policies on `profiles` must prevent a user from executing `UPDATE public.profiles SET role = 'admin'`. Only an existing Super Admin or direct database intervention can elevate user roles.

---

## 4. Asset Storage & Export Protocols

### A. Supabase Storage (School Assets)
*   Create a public bucket named `school-assets`.
*   Configure bucket policies to allow public reads. Only users with the `admin` role can upload or delete files within this bucket.

### B. Standardized PDF Generation
*   **Requirement:** Approved RPH documents must be exported with the school logo fetched from the `school-assets` bucket.
*   **Format:** The layout must include the KPM mandatory fields (Content Standard, Learning Standard, Teaching Aids).
*   **Verification:** Ensure the PDF clearly displays the approval status, approval date, and the name of the designated reviewer.
