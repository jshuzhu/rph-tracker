import { NextResponse } from 'next/server';
import { getSession, logout } from '../../../lib/auth';

export const runtime = 'edge';

export async function POST() {
  await logout();
  return NextResponse.json({ success: true });
}
