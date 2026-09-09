export const runtime = 'edge';

export async function GET() {
  return new Response(JSON.stringify({ error: 'No session' }), { 
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
