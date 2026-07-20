/**
 * Portfolio Revenue Engine — domain-neutral LINK HEALTH.
 *
 * The second half of "measure + protect". Measurement (the events module)
 * tells you what happened; link-health makes sure the money-link the user
 * clicks can actually pay you. It is a deterministic, network-free check that
 * an outbound monetized URL:
 *   1. does NOT point at a forbidden host (cross-property leakage), and
 *   2. DOES point at an allowed destination host, and
 *   3. carries the attribution signal(s) the network needs to credit the sale.
 *
 * Structural only — it validates a URL's SHAPE against a policy; it performs no
 * HTTP request (a live reachability probe is a separate runtime concern). That
 * makes it fast, side-effect-free, and safe to run in a unit test or a build
 * guard on every deploy — the cheapest possible defense against the whole class
 * of silent revenue bugs where a link resolves fine but earns $0 because it lost
 * its tracking or points at the wrong partner.
 *
 * DOMAIN-NEUTRAL by contract: no Booking/Expedia/VRBO/Viator here. Each owned
 * property maps itself to a LinkPolicy in its own layer (travel does this in
 * @adored/affiliate / the apps); this module only enforces a policy it is given.
 */

/** One attribution signal an outbound money-link must carry to earn commission. */
export interface RequiredSignal {
  /** The signal's key — a query param name, or a token to find in the raw href
   *  for path-encoded ids (e.g. a Partnerize-style `/camref:…`). */
  key: string;
  /** If set, the signal's value (query-param value, or the whole href for
   *  path-encoded ids) must match this pattern. */
  valuePattern?: RegExp;
  /** Human note surfaced in the failure reason. */
  note?: string;
}

/** What an outbound money-link is allowed to look like for one property. */
export interface LinkPolicy {
  /** Policy id — usually the owned property key. */
  id: string;
  /** Destination hosts a money-link may point at. Suffix match, so `example.com`
   *  matches `www.example.com` and `go.example.com`. At least one required. */
  allowedHosts: readonly string[];
  /** Hosts that must NEVER appear — the cross-property leakage guard. Checked
   *  first and hardest: a forbidden host fails even if it is also "allowed". */
  forbiddenHosts?: readonly string[];
  /** Attribution the link must carry. ALL are required for a pass. */
  requiredSignals?: readonly RequiredSignal[];
}

export type LinkHealthCode =
  | 'ok'
  | 'malformed' // not a parseable absolute URL
  | 'leaked' // host matches a forbiddenHost — most severe
  | 'wrong-host' // host is not in allowedHosts
  | 'untracked'; // an allowed host, but a required attribution signal is missing

export interface LinkHealthResult {
  url: string;
  ok: boolean;
  code: LinkHealthCode;
  /** Empty when ok; one entry per failed check otherwise. */
  reasons: string[];
}

/** `host` matches `suffix` as itself or a subdomain of it. */
function hostMatches(host: string, suffix: string): boolean {
  const h = host.toLowerCase();
  const s = suffix.toLowerCase().replace(/^\./, '');
  return h === s || h.endsWith(`.${s}`);
}

/** Check one URL against one policy. Pure + synchronous. */
export function checkLink(url: string, policy: LinkPolicy): LinkHealthResult {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, ok: false, code: 'malformed', reasons: ['not a valid absolute URL'] };
  }
  const host = parsed.hostname;

  // 1. Leakage — the most severe failure, checked first.
  const leaked = (policy.forbiddenHosts ?? []).find((f) => hostMatches(host, f));
  if (leaked) {
    return {
      url,
      ok: false,
      code: 'leaked',
      reasons: [`points at forbidden host "${host}" (matches "${leaked}")`],
    };
  }

  // 2. Allowed destination.
  if (!policy.allowedHosts.some((a) => hostMatches(host, a))) {
    return {
      url,
      ok: false,
      code: 'wrong-host',
      reasons: [`host "${host}" is not in allowedHosts [${policy.allowedHosts.join(', ')}]`],
    };
  }

  // 3. Attribution — a signal is satisfied by a matching query param OR, for
  //    path-encoded ids, a match anywhere in the raw href.
  const reasons: string[] = [];
  for (const sig of policy.requiredSignals ?? []) {
    const paramValue = parsed.searchParams.get(sig.key);
    let satisfied: boolean;
    if (paramValue !== null) {
      satisfied = sig.valuePattern ? sig.valuePattern.test(paramValue) : true;
    } else if (sig.valuePattern) {
      satisfied = sig.valuePattern.test(url); // path/label-encoded id
    } else {
      satisfied = url.includes(sig.key);
    }
    if (!satisfied) {
      reasons.push(`missing attribution "${sig.key}"${sig.note ? ` — ${sig.note}` : ''}`);
    }
  }
  if (reasons.length > 0) {
    return { url, ok: false, code: 'untracked', reasons };
  }

  return { url, ok: true, code: 'ok', reasons: [] };
}

export interface LinkHealthReport {
  policy: string;
  total: number;
  ok: number;
  failed: number;
  byCode: Record<LinkHealthCode, number>;
  /** Only the failing results, so a caller can log/alert on exactly what broke. */
  failures: LinkHealthResult[];
}

/** Check many URLs against one policy and roll up a report. */
export function checkLinks(urls: readonly string[], policy: LinkPolicy): LinkHealthReport {
  const byCode: Record<LinkHealthCode, number> = {
    ok: 0,
    malformed: 0,
    leaked: 0,
    'wrong-host': 0,
    untracked: 0,
  };
  const failures: LinkHealthResult[] = [];
  for (const url of urls) {
    const r = checkLink(url, policy);
    byCode[r.code] += 1;
    if (!r.ok) failures.push(r);
  }
  return {
    policy: policy.id,
    total: urls.length,
    ok: urls.length - failures.length,
    failed: failures.length,
    byCode,
    failures,
  };
}
