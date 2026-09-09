import { NextResponse } from 'next/server';
import { getSessionFromRequest, verifyToken } from '@/lib/auth-edge';

export const runtime = 'edge';

export async function GET(req) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
