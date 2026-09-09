// Edge-compatible auth - Extremely simplified version as requested

// We skip hashing entirely as requested ("masuk db keluar db, takde coding rumit")
export async function hashPassword(password) {
  return password; // Store and compare plain text passwords for ultimate simplicity
}

// "Sign Token" just stringifies the payload
export async function signToken(payload) {
  // Just return the payload as a stringified JSON encoded as base64 to avoid cookie character issues
  return btoa(JSON.stringify(payload));
}

// "Verify Token" just parses it back
export async function verifyToken(token) {
  try {
    const payload = JSON.parse(atob(token));
    return payload;
  } catch {
    return null;
  }
}

// Get session from request cookies
export async function getSessionFromRequest(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';')
        .map(c => c.trim().split('='))
        .filter(p => p.length >= 2)
        .map(([k, ...v]) => [k.trim(), decodeURIComponent(v.join('='))])
    );
    const token = cookies['rph_session'];
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}
