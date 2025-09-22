const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const basePath = (process.env.NEXT_BASE_PATH || '').replace(/^\/+|\/+$/g, '');
const targetDir = basePath ? path.join(distDir, basePath) : distDir;
const candidateDirs = [targetDir];

const renameList = [
  { from: 'page1.html.html', to: 'page1.html' },
  { from: 'page2.html.html', to: 'page2.html' },
];

if (!fs.existsSync(candidateDirs[0])) {
  candidateDirs[0] = distDir;
}

candidateDirs.forEach((dir) => {
  renameList.forEach(({ from, to }) => {
    const fromPath = path.join(dir, from);
    const toPath = path.join(dir, to);

    if (!fs.existsSync(fromPath)) {
      return;
    }
    if (fs.existsSync(toPath)) {
      fs.unlinkSync(toPath);
    }
    fs.renameSync(fromPath, toPath);
  });
});
