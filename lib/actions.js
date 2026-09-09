'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getSessionSimple } from '../app/actions/auth';

// Helper to get D1 DB
function getDB() {
  try {
    const db = getRequestContext().env.DB;
    if (!db) throw new Error('D1 binding not found');
    return db;
  } catch (e) {
    throw new Error('Database context not available.');
  }
}

export async function fetchTeacherRph(teacherId) {
  const session = await getSessionSimple();
  if (!session) throw new Error('Unauthorized');

  const db = getDB();
  const { results } = await db.prepare(`
    SELECT r.*, s.subject_name, c.class_name 
    FROM rph_submissions r
    LEFT JOIN master_subjects s ON r.subject_id = s.id
    LEFT JOIN master_classes c ON r.class_id = c.id
    WHERE r.teacher_id = ? AND r.is_deleted = 0
    ORDER BY r.lesson_date DESC
  `).bind(teacherId).all();
  
  return results;
}

export async function fetchDashboardAnalytics(teacherId, role) {
  const session = await getSessionSimple();
  if (!session) throw new Error('Unauthorized');
  
  const db = getDB();
  let query = 'SELECT status, COUNT(*) as count FROM rph_submissions WHERE is_deleted = 0 ';
  let bindings = [];
  
  if (role === 'teacher') {
    query += 'AND teacher_id = ? GROUP BY status';
    bindings.push(teacherId);
  } else {
    query += 'GROUP BY status';
  }
  
  const { results } = await db.prepare(query).bind(...bindings).all();
  return results;
}

export async function fetchQueue(status, role) {
  const session = await getSessionSimple();
  if (!session) throw new Error('Unauthorized');
  if (role === 'teacher') throw new Error('Forbidden');
  
  const db = getDB();
  let query = `
    SELECT r.*, s.subject_name, c.class_name, p.full_name as teacher_name 
    FROM rph_submissions r
    LEFT JOIN master_subjects s ON r.subject_id = s.id
    LEFT JOIN master_classes c ON r.class_id = c.id
    LEFT JOIN profiles p ON r.teacher_id = p.id
    WHERE r.is_deleted = 0 
  `;
  
  const bindings = [];
  if (status && status !== 'Semua') {
    query += ' AND r.status = ?';
    bindings.push(status);
  }
  
  query += ' ORDER BY r.lesson_date ASC';
  
  const { results } = await db.prepare(query).bind(...bindings).all();
  return results;
}

// Master Data
export async function fetchMasterSubjects() {
  const db = getDB();
  const { results } = await db.prepare('SELECT * FROM master_subjects WHERE is_active = 1 ORDER BY subject_name').all();
  return results;
}

export async function fetchMasterClasses() {
  const db = getDB();
  const { results } = await db.prepare('SELECT * FROM master_classes WHERE is_active = 1 ORDER BY class_name').all();
  return results;
}

export async function fetchCurriculum(subjectId, tahun) {
  const db = getDB();
  const { results } = await db.prepare('SELECT * FROM curriculum_standards WHERE subject_id = ? AND tahun = ?').bind(subjectId, tahun).all();
  return results;
}

// Admin / Users
export async function fetchAllUsers() {
  const session = await getSessionSimple();
  if (session?.role !== 'admin') throw new Error('Forbidden');
  
  const db = getDB();
  const { results } = await db.prepare('SELECT id, full_name, email, role FROM profiles').all();
  return results;
}

export async function updateUserRole(userId, newRole) {
  const session = await getSessionSimple();
  if (session?.role !== 'admin') throw new Error('Forbidden');
  
  const db = getDB();
  await db.prepare('UPDATE profiles SET role = ? WHERE id = ?').bind(newRole, userId).run();
  return { success: true };
}

export async function createRph(data) {
  const session = await getSessionSimple();
  if (!session) throw new Error('Unauthorized');
  
  const db = getDB();
  const id = crypto.randomUUID();
  
  await db.prepare(`
    INSERT INTO rph_submissions (
      id, teacher_id, subject_id, class_id, lesson_date, start_time, end_time, school_week,
      content_standard, learning_standard, objectives, activities, teaching_aids, reflection, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, session.id, data.subject_id, data.class_id, data.lesson_date, data.start_time, data.end_time, data.school_week,
    JSON.stringify(data.content_standard || []), JSON.stringify(data.learning_standard || []), JSON.stringify(data.objectives || []), 
    data.activities || '', data.teaching_aids || '', data.reflection || '', data.status || 'Draft'
  ).run();
  
  return { id };
}

export async function updateRph(id, data) {
  const session = await getSessionSimple();
  if (!session) throw new Error('Unauthorized');
  
  const db = getDB();
  
  // Very simplified update for the sake of example, normally we dynamically construct this
  await db.prepare(`
    UPDATE rph_submissions SET 
      subject_id=?, class_id=?, lesson_date=?, start_time=?, end_time=?, school_week=?,
      content_standard=?, learning_standard=?, objectives=?, activities=?, teaching_aids=?, reflection=?, status=?, updated_at=CURRENT_TIMESTAMP
    WHERE id = ? AND (teacher_id = ? OR ? = 'admin' OR ? = 'reviewer')
  `).bind(
    data.subject_id, data.class_id, data.lesson_date, data.start_time, data.end_time, data.school_week,
    JSON.stringify(data.content_standard || []), JSON.stringify(data.learning_standard || []), JSON.stringify(data.objectives || []), 
    data.activities || '', data.teaching_aids || '', data.reflection || '', data.status || 'Draft',
    id, session.id, session.role, session.role
  ).run();
  
  return { success: true };
}
