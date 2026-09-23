// Generates the 20 SYNTHETIC editorial-illustration portraits used by the Appreciate
// section until Online Campus delivers real, consented photos (US-03, DATA-22).
// Output: public/synthetic/portraits/pNN.svg. Run: npm run assets:portraits
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/synthetic/portraits/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const SKIN = ['#f6d8c3', '#efc3a2', '#e2aa84', '#c98f68', '#a9714e', '#8a573a', '#6c402b', '#f2cda9'];
const HAIR = ['#1f1a17', '#3b2a20', '#5a3b28', '#8a5a3a', '#c49a6c', '#2d2a28', '#77736e', '#d9c8a4'];
const CLOTH = ['#315264', '#c99a2e', '#e7e3da', '#2c3a40', '#8e5b4f', '#5f7a6a', '#ffc946', '#4a5d8a', '#b86b52', '#d9d4c7'];
const BG = ['#e9e4d8', '#dfe7e4', '#efe1d6', '#e3e6ef', '#f3e7c6', '#dbe3ea', '#e8dfe8', '#e4e9dc'];

// [hairStyle, skin, hair, cloth, bg, extras]
const PEOPLE = [
  ['long', 1, 1, 0, 0, 'cheeks'],
  ['bob', 0, 0, 6, 1, 'glasses'],
  ['short', 3, 0, 3, 2, ''],
  ['wavy', 4, 2, 1, 3, 'cheeks'],
  ['side', 2, 5, 7, 4, 'beard'],
  ['bun', 0, 3, 5, 5, 'cheeks'],
  ['short', 6, 0, 2, 6, 'glasses'],
  ['long', 2, 4, 8, 7, ''],
  ['buzz', 5, 0, 9, 0, 'beard'],
  ['curly', 5, 0, 1, 1, 'cheeks'],
  ['side', 7, 2, 4, 2, 'glasses'],
  ['bob', 3, 1, 7, 3, ''],
  ['short', 1, 6, 0, 4, 'glasses beard'],
  ['wavy', 7, 3, 3, 5, 'cheeks'],
  ['side', 4, 0, 6, 6, ''],
  ['bun', 6, 0, 8, 7, ''],
  ['curly', 3, 2, 9, 0, 'cheeks'],
  ['short', 0, 7, 5, 1, 'glasses'],
  ['long', 5, 1, 2, 2, 'cheeks'],
  ['buzz', 2, 5, 0, 3, ''],
];

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c * (1 - amount))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function hairBack(style, color) {
  switch (style) {
    case 'long':
      return `<path d="M72 112C66 58 100 44 122 46c30 2 54 22 46 72l6 86c-22 14-86 14-106 0z" fill="${color}"/>`;
    case 'wavy':
      return `<path d="M74 112C68 60 100 46 122 48c30 2 52 22 44 66 8 18-4 30 4 46-8 16-18 20-24 24H98c-10-4-22-10-26-24 8-16-4-30 2-48z" fill="${color}"/>`;
    case 'bob':
      return `<path d="M76 110C72 62 102 50 122 51c26 1 48 17 42 61l3 42c-16 10-78 10-94 0z" fill="${color}"/>`;
    case 'curly': {
      const dots = [];
      for (let i = 0; i < 15; i++) {
        const a = Math.PI * (0.92 + (i / 14) * 1.16);
        dots.push(`<circle cx="${(120 + Math.cos(a) * 48).toFixed(1)}" cy="${(104 + Math.sin(a) * 52).toFixed(1)}" r="17" fill="${color}"/>`);
      }
      return dots.join('');
    }
    case 'bun':
      return `<circle cx="120" cy="50" r="18" fill="${color}"/>`;
    default:
      return '';
  }
}

function hairFront(style, color) {
  switch (style) {
    case 'short':
      return `<path d="M80 108c-4-38 18-54 42-54 26 0 44 18 38 54-6-16-20-28-40-28s-34 12-40 28z" fill="${color}"/>`;
    case 'side':
      return `<path d="M80 112c-6-42 20-58 44-57 28 1 44 22 36 55-10-22-30-32-52-30-14 2-24 14-28 32z" fill="${color}"/>`;
    case 'buzz':
      return `<path d="M83 102c0-30 18-44 38-44s38 14 38 44c-8-12-22-20-38-20s-30 8-38 20z" fill="${color}" opacity=".9"/>`;
    case 'long':
    case 'wavy':
      return `<path d="M82 104c2-32 20-46 40-46 22 0 38 16 36 46-12-18-28-24-46-22-12 2-24 10-30 22z" fill="${color}"/>`;
    case 'bob':
      return `<path d="M81 100c2-30 20-42 41-42 22 0 37 14 37 42-14-6-30-8-40-8s-26 2-38 8z" fill="${color}"/>`;
    case 'bun':
      return `<path d="M82 104c0-34 18-46 40-46s40 12 38 46c-10-16-24-24-39-24s-30 8-39 24z" fill="${color}"/>`;
    case 'curly': {
      const dots = [];
      for (let i = 0; i < 7; i++) dots.push(`<circle cx="${88 + i * 10.5}" cy="${70 + Math.abs(3 - i) * 3}" r="12" fill="${color}"/>`);
      return dots.join('');
    }
    default:
      return '';
  }
}

function portrait([style, s, h, c, b, extras], index) {
  const skin = SKIN[s], skinShade = shade(skin, 0.12), hair = HAIR[h], cloth = CLOTH[c], bg = BG[b];
  const ink = '#2a2320';
  const has = (x) => extras.split(' ').includes(x);
  const n = String(index + 1).padStart(2, '0');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="Synthetic illustrated portrait ${n}">
<title>Synthetic portrait ${n} — illustration for layout testing, not a real person</title>
<rect width="240" height="240" fill="${bg}"/>
<circle cx="120" cy="104" r="84" fill="#ffffff" opacity=".35"/>
${hairBack(style, hair)}
<path d="M34 240c4-44 40-66 86-66s82 22 86 66z" fill="${cloth}"/>
<path d="M98 176c6 14 38 14 44 0" fill="none" stroke="${shade(cloth, 0.18)}" stroke-width="4" stroke-linecap="round"/>
<rect x="106" y="140" width="28" height="40" rx="12" fill="${skinShade}"/>
<ellipse cx="82" cy="112" rx="7" ry="10" fill="${skinShade}"/>
<ellipse cx="158" cy="112" rx="7" ry="10" fill="${skinShade}"/>
<ellipse cx="120" cy="108" rx="38" ry="46" fill="${skin}"/>
${has('beard') ? `<path d="M84 116c2 34 18 46 36 46s34-12 36-46c-6 18-18 28-36 28s-30-10-36-28z" fill="${hair}"/>` : ''}
${hairFront(style, hair)}
<path d="M100 100q6-4 12 0M128 100q6-4 12 0" fill="none" stroke="${hair}" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="106" cy="112" rx="3.2" ry="3.8" fill="${ink}"/>
<ellipse cx="134" cy="112" rx="3.2" ry="3.8" fill="${ink}"/>
${has('glasses') ? `<g fill="none" stroke="${ink}" stroke-width="2.4"><circle cx="106" cy="112" r="11"/><circle cx="134" cy="112" r="11"/><path d="M117 111h6"/></g>` : ''}
${has('cheeks') ? `<circle cx="96" cy="126" r="6" fill="#e58f7e" opacity=".32"/><circle cx="144" cy="126" r="6" fill="#e58f7e" opacity=".32"/>` : ''}
<path d="M120 116q-4 11 1 13" fill="none" stroke="${shade(skin, 0.22)}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M110 137q10 8 20 0" fill="none" stroke="${has('beard') ? '#f3e3d8' : '#8a4b43'}" stroke-width="3" stroke-linecap="round"/>
</svg>
`;
}

PEOPLE.forEach((p, i) => {
  writeFileSync(new URL(`p${String(i + 1).padStart(2, '0')}.svg`, OUT), portrait(p, i));
});
console.log(`Wrote ${PEOPLE.length} synthetic portraits to public/synthetic/portraits/`);
