export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getSessionFromRequest } from '@/lib/auth-edge';


export async function POST(req) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ data: null, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { table, query } = await req.json();
    
    let db;
    try {
      db = getRequestContext().env.DB;
    } catch(e) {}
    if (!db) return NextResponse.json({ data: [], error: { message: 'DB not found' } });

    // Handle INSERT
    if (query.insert) {
      const keys = Object.keys(query.insert);
      const vals = Object.values(query.insert);
      const placeholders = keys.map(() => '?').join(',');
      const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders}) RETURNING *`;
      const { results } = await db.prepare(sql).bind(...vals).all();
      return NextResponse.json({ data: results, error: null });
    }

    // Handle UPDATE
    if (query.update) {
      const keys = Object.keys(query.update);
      const vals = Object.values(query.update);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      
      let sql = `UPDATE ${table} SET ${setClause}`;
      let bindings = [...vals];

      if (query.filters && query.filters.length > 0) {
        const conditions = query.filters.map(f => {
          if (f.op === 'eq') {
            bindings.push(f.v);
            return `${f.k} = ?`;
          }
          return '';
        }).filter(Boolean);
        if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      sql += ` RETURNING *`;
      const { results } = await db.prepare(sql).bind(...bindings).all();
      return NextResponse.json({ data: results, error: null });
    }

    // Handle SELECT
    let sql = `SELECT ${query.select === '*' || !query.select ? '*' : query.select.split(',').map(s=>s.trim()).join(',')} FROM ${table}`;
    let bindings = [];

    if (query.filters && query.filters.length > 0) {
      const conditions = query.filters.map(f => {
        if (f.op === 'eq') {
          bindings.push(f.v);
          return `${f.k} = ?`;
        }
        if (f.op === 'neq') {
          bindings.push(f.v);
          return `${f.k} != ?`;
        }
        return '';
      }).filter(Boolean);
      if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (query.order && query.order.length > 0) {
      const orders = query.order.map(o => `${o.col} ${o.asc ? 'ASC' : 'DESC'}`);
      sql += ` ORDER BY ${orders.join(', ')}`;
    }

    if (query.limit) {
      sql += ` LIMIT ${query.limit}`;
    }

    const { results } = await db.prepare(sql).bind(...bindings).all();

    if (query.single) {
      return NextResponse.json({ data: results[0] || null, error: null });
    }

    return NextResponse.json({ data: results, error: null });
  } catch (error) {
    console.error('DB Proxy Error:', error);
    return NextResponse.json({ data: null, error: { message: error.message } });
  }
}
