// Script to generate hashed passwords and seed user accounts into D1
// Run: node seed_users.js

const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');

async function hashPassword(password) {
  // Replicate the same PBKDF2 algorithm from lib/auth.js using Node.js crypto
  return new Promise((resolve, reject) => {
    const salt = Buffer.from('rph-tracker-static-salt');
    // PBKDF2 -> HMAC-SHA256 key derivation (matching Web Crypto implementation)
    crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

async function main() {
  const password = 'Test@1234';
  const hash = await hashPassword(password);
  
  console.log(`Password hash for "${password}": ${hash}`);
  
  const accounts = [
    { id: 'user-admin-001', full_name: 'Admin Sistem', email: 'admin@test.edu.my', role: 'admin', title: 'Admin' },
    { id: 'user-teacher-001', full_name: 'Aminah binti Ahmad', email: 'cikgu1@test.edu.my', role: 'teacher', title: 'Guru' },
    { id: 'user-teacher-002', full_name: 'Hafiz bin Ibrahim', email: 'cikgu2@test.edu.my', role: 'teacher', title: 'Guru' },
    { id: 'user-teacher-003', full_name: 'Siti Rahmah binti Yusof', email: 'cikgu3@test.edu.my', role: 'teacher', title: 'Guru' },
    { id: 'user-reviewer-001', full_name: 'Zulkifli bin Hassan', email: 'penyemak1@test.edu.my', role: 'reviewer', title: 'Guru Besar' },
    { id: 'user-reviewer-002', full_name: 'Norlizan binti Ismail', email: 'penyemak2@test.edu.my', role: 'reviewer', title: 'PKP' },
  ];
  
  // Generate SQL
  let sql = '-- Seed user accounts\n';
  sql += 'DELETE FROM profiles WHERE email LIKE \'%@test.edu.my\';\n\n';
  
  for (const acc of accounts) {
    sql += `INSERT INTO profiles (id, full_name, email, password_hash, role, title) VALUES ('${acc.id}', '${acc.full_name}', '${acc.email}', '${hash}', '${acc.role}', '${acc.title}');\n`;
  }
  
  fs.writeFileSync('seed_users.sql', sql);
  console.log('\nFail seed_users.sql telah dijana!');
  console.log('Sekarang jalankan: npx wrangler d1 execute rph_tracker_db --remote --file=seed_users.sql');
}

main().catch(console.error);
