import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const hasCrypto = typeof crypto !== 'undefined';
    const hasSubtle = hasCrypto && typeof crypto.subtle !== 'undefined';
    const hasProcess = typeof process !== 'undefined';
    
    return NextResponse.json({ 
      ok: true, 
      hasCrypto, 
      hasSubtle,
      hasProcess,
      env: hasProcess ? Object.keys(process.env) : []
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
