const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'src/pages/HomePage.css');
const patch = path.join(process.cwd(), 'patches/home-promo-bar-exact-no-crop.css');
const marker = '7XBET exact Home Promo Bar no-crop fix';

if (!fs.existsSync(target)) {
  console.error('\nERROR: src/pages/HomePage.css পাওয়া যায়নি.');
  console.error('এই patch Backend Shell-এ নয়, Frontend project root-এ run করতে হবে.');
  console.error('Correct folder example: 7XBET-Frontend-main / frontend service root\n');
  process.exit(1);
}

if (!fs.existsSync(patch)) {
  console.error('\nERROR: patches/home-promo-bar-exact-no-crop.css পাওয়া যায়নি.');
  console.error('ZIP ঠিকভাবে frontend root-এ extract হয়েছে কি না check করুন.\n');
  process.exit(1);
}

let css = fs.readFileSync(target, 'utf8');
const patchCss = fs.readFileSync(patch, 'utf8');

if (css.includes(marker)) {
  console.log('Already applied: Home promo bar exact no-crop CSS exists.');
  process.exit(0);
}

fs.copyFileSync(target, `${target}.bak-home-promo-exact-no-crop`);
css = `${css.trim()}\n\n${patchCss}\n`;
fs.writeFileSync(target, css);
console.log('Applied: Home promo bar exact no-crop CSS added to src/pages/HomePage.css');
