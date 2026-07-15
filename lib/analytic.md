"""# E-RPH Reviewer Dashboard: Analytics & Filtering Specifications

This document outlines the UI/UX criteria, analytical components, and Supabase backend implementation for the Reviewer Dashboard within the E-RPH application. It serves as a technical reference for front-end developers and project managers.

---

## 1. Analytics & High-Level KPIs

To ensure reviewers (e.g., Head of Departments, Principals) can track progress efficiently without being overwhelmed by data, the dashboard should focus on traceability and actionable insights.

### A. Key Metrics (At a Glance)
* **Weekly Status Summary:** Scorecards displaying the total number of RPH submissions currently `Pending`, `Approved`, and `Not Approved` for the active school week.
* **Compliance Rate:** The percentage of teachers who have successfully submitted their RPH versus the total number of teachers under the reviewer's supervision.
* **Turnaround Time:** The average time taken by a reviewer to approve an RPH from the moment of submission.

### B. Teacher Tracking & Quality Control
* **The Deficit List (Missing RPH):** A dedicated table listing teachers who only have `Draft` statuses or have not initiated an RPH by the weekly deadline (e.g., Friday, 5:00 PM).
* **Rejection Heatmap:** Identifies teachers who frequently receive `Not Approved` statuses, allowing management to offer targeted pedagogical guidance.

### C. Workload & UI Visualizations
* **Action Queue:** A prioritized list showing exactly how many RPH submissions are currently awaiting the logged-in reviewer's specific approval tier.
* **Visual Charts:** 
  * **Donut Chart:** Visual breakdown of submission statuses.
  * **Bar/Line Chart:** Submission trends across the week to identify bottlenecks.

---

## 2. Filtering Criteria (UI/UX)

The data table for RPH submissions must include a dynamic toolbar with the following filtering options to allow reviewers to navigate large datasets easily:

1. **Status (Dropdown):** `All`, `Pending`, `Approved`, `Not Approved`. (Default state: `Pending`).
2. **Teacher Name (Search Bar):** Text input for finding specific teachers.
3. **School Week / Date Range (Dropdown/Date Picker):** Filter by specific academic weeks (e.g., Week 1, Week 2).
4. **Subject & Class (Dropdown):** Fetched dynamically from `master_subjects` and `master_classes`.

---

## 3. Backend Implementation (Supabase JavaScript SDK)

To execute the filtering efficiently without overloading the browser or API quota, the system must use **dynamic query chaining**, **inner joins**, and **pagination**.

### Dynamic Query Example

```javascript
// Function to fetch RPH data based on reviewer's active filters
async function fetchFilteredRPH(filters) {
  
  // 1. Base Query with Inner Joins
  // !inner is used to ensure accurate filtering on related tables
  let query = supabase
    .from('rph_submissions')
    .select(`
      id,
      lesson_date,
      start_time,
      end_time,
      status,
      profiles!inner ( full_name ),
      master_subjects!inner ( subject_name ),
      master_classes!inner ( class_name )
    `)
    .eq('is_deleted', false); // Mandatory: Hide soft-deleted records

  // 2. Dynamic Filtering Logic
  
  // Filter by Status
  if (filters.status && filters.status !== 'All') {
    query = query.eq('status', filters.status);
  }

  // Filter by School Week
  if (filters.school_week) {
    query = query.eq('school_week', filters.school_week);
  }

  // Filter by Teacher Name (Case-insensitive partial search)
  if (filters.teacherName) {
    query = query.ilike('profiles.full_name', `%${filters.teacherName}%`);
  }

  // Filter by Subject
  if (filters.subject_id) {
    query = query.eq('subject_id', filters.subject_id);
  }

  // 3. Execute Query with Pagination
  const { data, error } = await query
    .order('created_at', { ascending: false }) // Newest first
    .range(0, 49); // Pagination: Fetch only the first 50 records

  if (error) {
    console.error("Error fetching RPH data:", error.message);
    return null;
  }

  return data;
}