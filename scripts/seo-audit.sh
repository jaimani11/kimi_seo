#!/usr/bin/env bash
#
# seo-audit.sh — technical-SEO health check for the Adored Moments network.
#
# Runs the same checks we use to catch "Duplicate without user-selected
# canonical" and other indexability regressions, over any list of live
# domains. Designed to scale from 4 sites to 20: pass bare apex domains,
# it derives the www host itself.
#
# Usage:
#   scripts/seo-audit.sh                        # audits the 4 default sites
#   scripts/seo-audit.sh gobookt.com foo.com    # audits specific domains
#   SAMPLE=25 scripts/seo-audit.sh              # deeper sitemap URL sampling
#
# Exit code is non-zero if any domain has a FAIL, so it can gate CI.
#
# Checks per domain (canonical host is assumed to be www):
#   1. Host canonicalization — apex+www × http+https all end on https://www
#   2. Homepage returns 200 and emits exactly ONE canonical <link>
#   3. Canonical points at the www host (not apex, not *.vercel.app)
#   4. robots.txt exists and references the www sitemap
#   5. sitemap.xml resolves (following redirects) and lists www URLs
#   6. Organization + WebSite JSON-LD present on the homepage
#   7. Spot-check: N random sitemap URLs all return 200

set -uo pipefail

DOMAINS=("$@")
if [ ${#DOMAINS[@]} -eq 0 ]; then
  DOMAINS=(numiworks.com gotript.com gobookt.com stayviaowner.com)
fi
SAMPLE="${SAMPLE:-8}"
CURL=(curl -sS --max-time 20)

pass=0; warn=0; fail=0
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; pass=$((pass+1)); }
note() { printf "  \033[33m⚠\033[0m %s\n" "$1"; warn=$((warn+1)); }
bad()  { printf "  \033[31m✗\033[0m %s\n" "$1"; fail=$((fail+1)); }

status() { "${CURL[@]}" -o /dev/null -w "%{http_code}" -L "$1" 2>/dev/null; }
redirect_target() { "${CURL[@]}" -o /dev/null -w "%{redirect_url}" "$1" 2>/dev/null; }

for apex in "${DOMAINS[@]}"; do
  www="www.${apex}"
  canonical_origin="https://${www}"
  printf "\n\033[1m=== %s ===\033[0m\n" "$apex"

  # 1. Host canonicalization — every variant should land on https://www/
  echo "[1] host canonicalization → ${canonical_origin}/"
  for variant in "http://${apex}/" "https://${apex}/" "http://${www}/"; do
    final=$("${CURL[@]}" -o /dev/null -w "%{url_effective}" -L "$variant" 2>/dev/null)
    code=$(status "$variant")
    if [ "$code" = "000" ]; then
      bad "$variant → no response (DNS/cert?)"
    elif [[ "$final" == "${canonical_origin}/"* || "$final" == "${canonical_origin}" ]]; then
      ok "$variant → $final"
    else
      bad "$variant → $final (expected ${canonical_origin}/)"
    fi
  done
  # www itself must serve 200 (not redirect onward)
  wc=$(status "${canonical_origin}/")
  [ "$wc" = "200" ] && ok "${canonical_origin}/ → 200" || bad "${canonical_origin}/ → $wc (expected 200)"

  # Fetch homepage once for the tag checks
  home_html=$("${CURL[@]}" -L "${canonical_origin}/" 2>/dev/null)

  # 2. Exactly one canonical tag
  ccount=$(printf '%s' "$home_html" | grep -oE '<link[^>]*rel="canonical"[^>]*>' | wc -l | tr -d ' ')
  if [ "$ccount" = "1" ]; then ok "homepage has exactly 1 canonical tag"
  elif [ "$ccount" = "0" ]; then bad "homepage has NO canonical tag"
  else bad "homepage has $ccount canonical tags (expected 1)"; fi

  # 3. Canonical points at www host
  chref=$(printf '%s' "$home_html" | grep -oE '<link[^>]*rel="canonical"[^>]*>' | grep -oE 'href="[^"]*"' | head -1 | sed 's/href="//;s/"//')
  if [ -n "$chref" ]; then
    if [[ "$chref" == "https://${www}"* ]]; then ok "canonical → $chref"
    else bad "canonical → $chref (expected https://${www})"; fi
  fi

  # 4. robots.txt references www sitemap
  robots=$("${CURL[@]}" -L "${canonical_origin}/robots.txt" 2>/dev/null)
  if printf '%s' "$robots" | grep -qi "Sitemap: https://${www}/sitemap.xml"; then
    ok "robots.txt references https://${www}/sitemap.xml"
  else
    note "robots.txt missing/!= https://${www}/sitemap.xml"
  fi

  # 5. sitemap resolves and uses www URLs
  smcode=$(status "${canonical_origin}/sitemap.xml")
  sm=$("${CURL[@]}" -L "${canonical_origin}/sitemap.xml" 2>/dev/null)
  locs=$(printf '%s' "$sm" | grep -oE "<loc>https://${www}[^<]*</loc>" | wc -l | tr -d ' ')
  if [ "$smcode" = "200" ] && [ "$locs" -gt 0 ]; then
    ok "sitemap.xml → 200, $locs www URLs"
  else
    bad "sitemap.xml → $smcode, $locs www <loc> entries"
  fi

  # 6. Organization + WebSite JSON-LD on homepage
  if printf '%s' "$home_html" | grep -q '"@type":"Organization"' && \
     printf '%s' "$home_html" | grep -q '"@type":"WebSite"'; then
    ok "homepage has Organization + WebSite JSON-LD"
  else
    note "homepage missing Organization/WebSite JSON-LD"
  fi

  # 7. Spot-check N random sitemap URLs
  if [ "$locs" -gt 0 ]; then
    # Portable (bash 3.2+) array fill — macOS ships bash 3.2, no `mapfile`.
    urls=()
    while IFS= read -r line; do urls+=("$line"); done < <(printf '%s' "$sm" | grep -oE "<loc>[^<]*</loc>" | sed 's/<loc>//;s/<\/loc>//' | awk "NR % (int($locs/$SAMPLE)+1) == 0" | head -"$SAMPLE")
    bad_urls=0
    for u in "${urls[@]}"; do
      [ "$(status "$u")" = "200" ] || { bad_urls=$((bad_urls+1)); echo "      404: $u"; }
    done
    [ "$bad_urls" = "0" ] && ok "sampled ${#urls[@]} sitemap URLs → all 200" \
      || bad "$bad_urls of ${#urls[@]} sampled sitemap URLs not 200"
  fi
done

printf "\n\033[1m=== summary: %d passed, %d warnings, %d failed ===\033[0m\n" "$pass" "$warn" "$fail"
[ "$fail" -eq 0 ]
