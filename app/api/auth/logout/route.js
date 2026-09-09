import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('rph_session', '', { 
    httpOnly: true, 
    secure: true, 
    path: '/',
    maxAge: 0
  });
  return response;
}
