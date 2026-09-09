import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-edge';

export async function GET(req) {
  try {
    const session = await getSessionFromRequest(req);
    
    if (!session) {
      return NextResponse.json({ error: 'Tiada sesi aktif' }, { status: 401 });
    }

    return NextResponse.json({ user: session });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 });
  }
}
