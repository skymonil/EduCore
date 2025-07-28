import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get bump type from CLI
const bumpType = process.argv[2] || 'patch';

// Paths relative to server/
const targets = [
  '../package.json',           // root
  '../client/package.json',    // client
  './package.json'             // server
];

targets.forEach((filePath) => {
  const fullPath = path.resolve(__dirname, filePath);
  const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  let [major, minor, patch] = pkg.version.split('.').map(Number);

  if (bumpType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bumpType === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  const newVersion = `${major}.${minor}.${patch}`;
  pkg.version = newVersion;

  fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2));
  console.log(`${filePath} updated to ${newVersion}`);
});
