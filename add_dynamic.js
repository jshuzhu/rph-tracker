const fs = require('fs');
 // Not available by default, I'll just use manual list.

const files = [
  'app/api/auth/login/route.js',
  'app/api/auth/logout/route.js',
  'app/api/auth/me/route.js',
  'app/api/auth/register/route.js',
  'app/api/db/route.js',
  'app/api/send-email/route.js',
  'app/api/debug/route.js'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes("export const dynamic = 'force-dynamic';")) {
      fs.writeFileSync(f, "export const dynamic = 'force-dynamic';\n" + content);
    }
  }
});
