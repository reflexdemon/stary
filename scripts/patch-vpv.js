const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', 'vpv-panchangam', 'dist', 'ephemeris', 'browser.js');

if (fs.existsSync(target)) {
  let content = fs.readFileSync(target, 'utf8');
  let changed = false;

  if (content.includes('require("node:fs/promises")')) {
    content = content.replace(
      'Promise.resolve().then(() => __importStar(require("node:fs/promises")))',
      'fallbackImport("node:fs/promises")'
    );
    changed = true;
  }
  if (content.includes('require("node:url")')) {
    content = content.replace(
      'Promise.resolve().then(() => __importStar(require("node:url")))',
      'fallbackImport("node:url")'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(target, content, 'utf8');
    console.log('[patch-vpv] Patched vpv-panchangam browser.js for Webpack bundler compatibility.');
  }
}
