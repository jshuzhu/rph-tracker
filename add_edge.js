const fs = require('fs');

const files = [
  'app/api/auth/login/route.js',
  'app/api/auth/logout/route.js',
  'app/api/auth/me/route.js',
  'app/api/auth/register/route.js',
  'app/api/db/route.js',
  'app/api/send-email/route.js',
  'app/api/debug/route.js',
  'app/rph/[id]/edit/page.js',
  'app/rph/[id]/page.js'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace("export const dynamic = 'force-dynamic';\n", "");
    if (!content.includes("export const runtime = 'edge';")) {
      fs.writeFileSync(f, "export const runtime = 'edge';\n" + content);
    }
  }
});
