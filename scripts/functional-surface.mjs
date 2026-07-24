#!/usr/bin/env node
/**
 * functional-surface — a migration regression harness.
 *
 * Captures the surface that users + search engines actually consume from a
 * rendered page (H1, H2 hierarchy, canonical, meta description, JSON-LD
 * entities, internal links, affiliate CTAs), so a page can be diffed before and
 * after a refactor for FUNCTIONAL equivalence — ignoring whitespace, attribute
 * order, and JSON key order, which are not meaningful regressions.
 *
 * Usage:
 *   node scripts/functional-surface.mjs capture <url> <out.json>
 *   node scripts/functional-surface.mjs diff <old.json> <new.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const AFFILIATE_HOSTS = /booking\.com|expedia\.com|vrbo\.com|viator\.com|prf\.hn|anrdoezrs\.net|tkqlhce\.com|dpbolvw\.net|jdoqocy\.com|kqzyfj\.com/i;

function clean(html) {
  return html.replace(/<!--.*?-->/gs, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
function all(re, s) {
  const out = [];
  let m;
  while ((m = re.exec(s)) !== null) out.push(m[1]);
  return out;
}

async function capture(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'functional-surface/1.0' } });
  const html = await res.text();

  const h1 = (all(/<h1[^>]*>(.*?)<\/h1>/gis, html).map(clean)[0]) ?? null;
  const h2 = all(/<h2[^>]*>(.*?)<\/h2>/gis, html).map(clean).filter(Boolean);
  const canonical = (html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) ?? [])[1] ?? null;
  const metaDescription = (html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) ?? [])[1] ?? null;
  const title = clean((html.match(/<title[^>]*>(.*?)<\/title>/is) ?? [])[1] ?? '');

  const jsonLdTypes = [];
  for (const block of all(/<script[^>]+application\/ld\+json[^>]*>(.*?)<\/script>/gis, html)) {
    try {
      const parsed = JSON.parse(block);
      for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
        if (node && node['@type']) jsonLdTypes.push(node['@type']);
      }
    } catch {
      jsonLdTypes.push('UNPARSEABLE');
    }
  }

  const hrefs = all(/href="([^"]+)"/gi, html);
  const internalLinks = [...new Set(hrefs.filter((h) => h.startsWith('/')))].sort();
  const affiliateCtas = hrefs.filter((h) => AFFILIATE_HOSTS.test(h));

  return {
    status: res.status,
    title,
    h1,
    h2,
    h2Count: h2.length,
    canonical,
    metaDescription,
    jsonLdTypes: [...new Set(jsonLdTypes)].sort(),
    internalLinks,
    internalLinkCount: internalLinks.length,
    affiliateCtaCount: affiliateCtas.length,
  };
}

function diff(oldS, newS) {
  const errors = [];
  const eq = (k, a, b) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) errors.push(`${k}: OLD ${JSON.stringify(a)} !== NEW ${JSON.stringify(b)}`);
  };
  eq('h1', oldS.h1, newS.h1);
  eq('h2', oldS.h2, newS.h2);
  eq('canonical', oldS.canonical, newS.canonical);
  eq('metaDescription', oldS.metaDescription, newS.metaDescription);
  eq('jsonLdTypes', oldS.jsonLdTypes, newS.jsonLdTypes);
  eq('internalLinks', oldS.internalLinks, newS.internalLinks);
  eq('affiliateCtaCount', oldS.affiliateCtaCount, newS.affiliateCtaCount);
  return errors;
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === 'capture') {
  const surface = await capture(a);
  writeFileSync(b, JSON.stringify(surface, null, 2));
  console.log(`captured ${a} → ${b}  (h1=${JSON.stringify(surface.h1)} h2s=${surface.h2Count} ld=${surface.jsonLdTypes.join('+')} links=${surface.internalLinkCount} cta=${surface.affiliateCtaCount})`);
} else if (cmd === 'diff') {
  const errors = diff(JSON.parse(readFileSync(a, 'utf8')), JSON.parse(readFileSync(b, 'utf8')));
  if (errors.length === 0) {
    console.log('✅ PASS — functional surfaces equivalent');
  } else {
    console.log('❌ FAIL — functional differences:');
    for (const e of errors) console.log(`  - ${e}`);
    process.exit(1);
  }
} else {
  console.error('usage: functional-surface.mjs capture <url> <out.json> | diff <old.json> <new.json>');
  process.exit(2);
}
