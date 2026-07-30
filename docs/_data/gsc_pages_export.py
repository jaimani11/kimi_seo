#!/usr/bin/env python3
"""
Complete GSC "Pages" export via the Search Console API (NOT the 1,000-row UI cap).

The GSC UI Pages export returns only ~1,000 representative rows. For a 46,604-URL
portfolio that silently truncates the long tail and would make the family report
understate low-traffic families. This script pulls the FULL page list using the
Search Analytics API with rowLimit=25000 + startRow pagination, and writes CSVs
that drop straight into gsc_family_report.py.

NOT part of the app build. Read-only against the GSC API. No production code touched.

SETUP (one time)
----------------
  pip install google-api-python-client google-auth
Auth, pick ONE:
  A) Service account: create a GCP service-account JSON key, then in Search Console
     add the service-account email as a *user* (Settings -> Users and permissions)
     on each property. Pass --creds sa.json.
  B) OAuth: create an OAuth desktop client, run once to cache a token. (See Google's
     "Search Console API quickstart".) Pass --creds token.json --oauth.

USAGE
-----
  python3 gsc_pages_export.py \
      --creds sa.json \
      --site "sc-domain:gotript.com" \
      --brand gotript --window before \
      --start 2026-07-01 --end 2026-07-17 \
      --out ./gsc_csv

Run once per (site, window). Domain properties use "sc-domain:<domain>";
URL-prefix properties use the full "https://www.<domain>/" string.
Recommended windows: before=2026-07-01..07-17, after=2026-07-18..07-27 (mature),
then rerun 'after' later once recent days finalize.

Writes  <out>/<brand>_<window>.csv  (+ a .meta.txt provenance sidecar).
"""
import argparse, csv, os, sys, datetime

def build_service(creds_path, oauth):
    try:
        from googleapiclient.discovery import build
    except ImportError:
        sys.exit("Missing deps. Run: pip install google-api-python-client google-auth")
    if oauth:
        from google.oauth2.credentials import Credentials
        creds=Credentials.from_authorized_user_file(creds_path,
              ["https://www.googleapis.com/auth/webmasters.readonly"])
    else:
        from google.oauth2 import service_account
        creds=service_account.Credentials.from_service_account_file(creds_path,
              scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
    return build("searchconsole","v1",credentials=creds,cache_discovery=False)

def fetch_all_pages(svc, site, start, end):
    """Retrieve all rows the Search Analytics API MAKES AVAILABLE for this query
    (page dimension). This is NOT the full site corpus: Google returns top rows
    subject to internal limits (~50k/day/type) and may drop some rows. The complete
    URL corpus must come from the sitemap inventory; this is performance evidence to
    JOIN onto it. Returns (rows, raw_pages) — raw_pages is each API response for backup."""
    rows=[]; raw=[]; start_row=0; PAGE=25000
    while True:
        resp=svc.searchanalytics().query(siteUrl=site, body={
            "startDate":start,"endDate":end,"dimensions":["page"],
            "type":"web","aggregationType":"auto","dataState":"final",
            "rowLimit":PAGE,"startRow":start_row}).execute()
        raw.append(resp)
        batch=resp.get("rows",[])
        if not batch: break
        rows.extend(batch)
        if len(batch)<PAGE: break
        start_row+=PAGE
    return rows, raw

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--creds",required=True); ap.add_argument("--oauth",action="store_true")
    ap.add_argument("--site",required=True,help='e.g. sc-domain:gotript.com')
    ap.add_argument("--brand",required=True); ap.add_argument("--window",required=True)
    ap.add_argument("--start",required=True); ap.add_argument("--end",required=True)
    ap.add_argument("--out",default=".")
    a=ap.parse_args()
    os.makedirs(a.out,exist_ok=True)
    svc=build_service(a.creds,a.oauth)
    rows, raw=fetch_all_pages(svc,a.site,a.start,a.end)
    out=os.path.join(a.out,f"{a.brand}_{a.window}.csv")
    with open(out,"w",newline="",encoding="utf-8") as f:
        w=csv.writer(f); w.writerow(["Top pages","Clicks","Impressions","CTR","Position"])
        for r in rows:
            page=r["keys"][0]
            w.writerow([page, int(r.get("clicks",0)), int(r.get("impressions",0)),
                        f'{r.get("ctr",0)*100:.2f}%', round(r.get("position",0),1)])
    # raw API JSON backup (avoids re-hitting rate limits to reclassify later)
    import json
    with open(out[:-4]+".raw.json","w",encoding="utf-8") as j:
        json.dump(raw,j)
    # provenance sidecar
    days=(datetime.date.fromisoformat(a.end)-datetime.date.fromisoformat(a.start)).days+1
    with open(out[:-4]+".meta.txt","w",encoding="utf-8") as m:
        m.write(f"property={a.site}\nexport_source=API (Search Analytics: page dim, type=web, dataState=final)\n")
        m.write(f"requested_date_range={a.start}..{a.end} ({days} days)\nrows_exported={len(rows)}\n")
        m.write(f"row_page_size=25000 (paginated via startRow)\n")
        m.write(f"caveat=API returns top rows subject to internal limits; NOT guaranteed to be every URL.\n")
        m.write(f"caveat=A missing URL = 'no GSC row', not proven zero. Confirm '{a.end}' is a finalized date.\n")
    print(f"wrote {out}  rows={len(rows)}  ({days} days; +.raw.json +.meta.txt)")
    print("  (rows = all the API made available for this query, subject to Google's internal limits —")
    print("   NOT necessarily every site URL. Join onto the sitemap inventory for the full denominator.)")

if __name__=="__main__":
    main()
