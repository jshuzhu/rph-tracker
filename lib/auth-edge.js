// Edge-compatible auth - Pure Web Crypto API, no external dependencies

const getSecret = () => {
  const secret = (typeof process !== 'undefined' && process.env?.JWT_SECRET) 
    || 'rph-tracker-fallback-secret-2026';
  return new TextEncoder().encode(secret);
};

// Hash password using PBKDF2
export async function hashPassword(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']
  );
  const salt = enc.encode('rph-tracker-static-salt');
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true, ['sign', 'verify']
  );
  const hashBuffer = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Base64url helpers
function base64urlEncode(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

// Sign JWT using HMAC-SHA256
export async function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + 86400 }; // 24h

  const enc = new TextEncoder();
  const headerB64 = base64urlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(enc.encode(JSON.stringify(claims)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const secret = getSecret();
  const key = await crypto.subtle.importKey(
    'raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  return `${signingInput}.${base64urlEncode(sig)}`;
}

// Verify JWT
export async function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    const secret = getSecret();
    const key = await crypto.subtle.importKey(
      'raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const enc = new TextEncoder();
    const valid = await crypto.subtle.verify(
      'HMAC', key, base64urlDecode(sigB64), enc.encode(signingInput)
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
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
        .map(([k, ...v]) => [k.trim(), v.join('=')])
    );
    const token = cookies['rph_session'];
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}
