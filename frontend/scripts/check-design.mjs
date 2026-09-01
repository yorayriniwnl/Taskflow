import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
const required = [
  '#000000',
  '#050505',
  '#e84b4b',
  '#671515',
  '#ff8a7f',
  '#f5eaea',
  '#c4c4c4',
  'linear-gradient(135deg, #671515, #8c1616, #2a0505)',
];
const missing = required.filter((token) => !css.toLowerCase().includes(token.toLowerCase()));
if (missing.length) {
  console.error(`Missing YOR tokens: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('YOR design contract: PASS');
