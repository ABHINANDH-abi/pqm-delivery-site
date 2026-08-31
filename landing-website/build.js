const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const distDir = path.join(__dirname, 'dist');

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

fs.mkdirSync(distDir, { recursive: true });

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    const basename = path.basename(src);
    if (basename === 'dist' || basename === 'node_modules' || basename === '.git') return;
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

for (const file of fs.readdirSync(srcDir)) {
  if (file === 'dist' || file === 'node_modules' || file === '.git' || file === 'package.json' || file === 'package-lock.json' || file === 'build.js') continue;
  copyRecursive(path.join(srcDir, file), path.join(distDir, file));
}

console.log('Successfully generated dist directory for Vercel deployment!');
