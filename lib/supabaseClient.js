class SupabaseQueryBuilder {
  constructor(table) {
    this.table = table;
    this.query = { select: '*', filters: [], single: false, order: [] };
  }
  select(cols) { this.query.select = cols || '*'; return this; }
  eq(k, v) { this.query.filters.push({ op: 'eq', k, v }); return this; }
  neq(k, v) { this.query.filters.push({ op: 'neq', k, v }); return this; }
  single() { this.query.single = true; return this; }
  order(col, opts = { ascending: true }) { this.query.order.push({ col, asc: opts.ascending }); return this; }
  limit(n) { this.query.limit = n; return this; }
  
  insert(data) { this.query.insert = data; return this; }
  update(data) { this.query.update = data; return this; }
  
  // Terminal execution
  async then(resolve, reject) {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: this.table, query: this.query })
      });
      const result = await res.json();
      resolve(result); 
    } catch(err) {
      resolve({ data: null, error: err });
    }
  }
}

export const supabase = {
  from: (table) => new SupabaseQueryBuilder(table),
  auth: {
    // Auth is handled by custom endpoints now, but provide dummies for safety
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  }
};