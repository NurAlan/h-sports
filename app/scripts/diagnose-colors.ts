/**
 * Standalone color clash diagnostic
 * Run: npx tsx scripts/diagnose-colors.ts
 */
import { chromium } from 'playwright';

const PAGES = [
  { name: 'Dashboard',  url: 'http://localhost:3000' },
  { name: 'Production', url: 'http://localhost:3000/production' },
  { name: 'Orders',     url: 'http://localhost:3000/orders' },
  { name: 'Inventory',  url: 'http://localhost:3000/inventory' },
  { name: 'Reports',    url: 'http://localhost:3000/reports' },
  { name: 'Profile',    url: 'http://localhost:3000/profile' },
];

// Serialised as a string so tsx bundling cannot inject __name
const EVALUATOR = `
(function() {
  var elements = Array.from(document.querySelectorAll(
    'button, span, div, a, p, li, header, nav, section'
  ));
  var banned = [];
  var clashes = [];
  var colorList = [];

  elements.forEach(function(el) {
    var computed = window.getComputedStyle(el);
    var cn = typeof el.className === 'string' ? el.className : '';
    var tag = el.tagName + (cn ? '.' + cn.trim().split(/\\s+/)[0] : '');

    [computed.backgroundColor, computed.color, computed.borderColor].forEach(function(cs) {
      if (!cs || cs === 'rgba(0, 0, 0, 0)' || cs === 'transparent') return;
      var m = cs.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
      if (!m) return;
      var r = +m[1], g = +m[2], b = +m[3];

      // Skip near-neutrals (grays, whites, blacks)
      if (Math.abs(r-g) < 25 && Math.abs(g-b) < 25 && Math.abs(r-b) < 25) return;
      var brightness = (r + g + b) / 3;
      if (brightness < 20 || brightness > 245) return;

      var hex = '#' + [r,g,b].map(function(x){return x.toString(16).padStart(2,'0');}).join('');

      // Sky: high blue, medium-high green, low red  e.g. #38bdf8 #0ea5e9 #7dd3fc
      if (b > 170 && g > 130 && r < 120 && b > g && b > r + 80)
        banned.push('SKY    ' + hex + '  on <' + tag + '>');

      // Teal: high green+blue roughly equal, very low red  e.g. #14b8a6 #0d9488
      if (g > 140 && b > 120 && r < 60 && Math.abs(g-b) < 60)
        banned.push('TEAL   ' + hex + '  on <' + tag + '>');

      // Violet/purple: r and b both high, g low  e.g. #7c3aed #8b5cf6 #a78bfa
      if (r > 90 && b > 140 && g < 110 && g < r && g < b)
        banned.push('VIOLET ' + hex + '  on <' + tag + '>');

      // Raw green (not emerald): strong green, both r and b low
      if (g > 150 && r < 80 && b < 80)
        banned.push('GREEN  ' + hex + '  on <' + tag + '>');

      colorList.push({hex:hex, r:r, g:g, b:b});
    });
  });

  // Deduplicate
  var seen = {};
  banned = banned.filter(function(x){ if(seen[x]) return false; seen[x]=true; return true; });

  // Orange+Blue / Red+Green pair clashes
  for (var i = 0; i < colorList.length; i++) {
    for (var j = i+1; j < colorList.length; j++) {
      var c1 = colorList[i], c2 = colorList[j];
      var o1 = c1.r>190 && c1.g>80  && c1.g<190 && c1.b<80;
      var o2 = c2.r>190 && c2.g>80  && c2.g<190 && c2.b<80;
      var bl1= c1.b>150 && c1.r<100 && c1.g<120;
      var bl2= c2.b>150 && c2.r<100 && c2.g<120;
      var r1 = c1.r>180 && c1.g<80  && c1.b<80;
      var r2 = c2.r>180 && c2.g<80  && c2.b<80;
      var g1 = c1.g>150 && c1.r<100 && c1.b<100;
      var g2 = c2.g>150 && c2.r<100 && c2.b<100;
      if ((o1&&bl2)||(o2&&bl1)) clashes.push('ORANGE+BLUE  ' + c1.hex + ' + ' + c2.hex);
      if ((r1&&g2)||(r2&&g1))   clashes.push('RED+GREEN    ' + c1.hex + ' + ' + c2.hex);
    }
  }

  var seenC = {};
  clashes = clashes.filter(function(x){ if(seenC[x]) return false; seenC[x]=true; return true; });

  return { banned: banned, clashes: clashes };
})()
`;

async function analyzePage(page: any, name: string) {
  const result = await page.evaluate(EVALUATOR);
  const all = [...result.banned, ...result.clashes];
  if (all.length === 0) {
    console.log(`✅  ${name}: CLEAN`);
  } else {
    console.log(`\n❌  ${name}: ${all.length} issue(s)`);
    all.forEach((i: string) => console.log(`    ${i}`));
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'wahyunuralan@gmail.com');
  await page.fill('input[type="password"]', 'passwords');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3000', { timeout: 15000 });

  console.log('\n=== H-Sport Color Clash Diagnostic ===\n');

  for (const { name, url } of PAGES) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await analyzePage(page, name);
    } catch (e: any) {
      console.log(`⚠️  ${name}: error — ${e.message}`);
    }
  }

  await browser.close();
  console.log('\n=== Done ===\n');
})();
