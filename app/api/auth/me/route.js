export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-edge';

export async function GET(req) {
  try {
    const session = await getSessionFromRequest(req);
    
    if (!session) {
      return NextResponse.json({ error: 'Tidak dibenarkan' }, { status: 401 });
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Ralat pelayan.' }, { status: 500 });
  }
}
