#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract landPlots from the Cornucopias game-maps page (local HTML/JSON dump or live URL)
and write a CSV with columns:
Id, sector, District, House number, Town, size, Latitude, Longitude, rotation

Usage:
  # from a local file (your saved game-maps.txt / HTML dump)
  python3 export_landplots_csv.py --input /path/to/game-maps.txt \
    --output /home/lilyserver/docker/cm/data/landplots.csv

  # or fetch live from the site (no extra libs needed)
  python3 export_landplots_csv.py --url "https://cornucopias.io/game-maps?map=solace-2" \
    --output /home/lilyserver/docker/cm/data/landplots-solace-2.csv
"""

import argparse, json, sys, os, csv, urllib.request, re

def read_text_from_input(input_path=None, url=None):
    if input_path:
        with open(input_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    elif url:
        req = urllib.request.Request(url, headers={
            "User-Agent": "landplots-export/1.0",
            "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    else:
        raise SystemExit("Provide --input or --url")

def extract_next_data(html_text):
    """
    Pull the JSON inside <script id="__NEXT_DATA__" type="application/json">…</script>
    and return it as a Python dict. Returns None if not found.
    """
    m = re.search(r'<script[^>]+id="__NEXT_DATA__"[^>]*>(.*?)</script>',
                  html_text, flags=re.DOTALL | re.IGNORECASE)
    if not m:
        return None
    payload = m.group(1).strip()
    return json.loads(payload)

def extract_landplots_from_next(next_data):
    """
    Navigate Next.js dehydrated queries to find any entry that has data.landPlots
    and return the concatenated list.
    """
    out = []
    try:
        queries = next_data["props"]["pageProps"]["dehydratedState"]["queries"]
    except Exception:
        return out
    for q in queries:
        try:
            data = q.get("state", {}).get("data", {})
            if isinstance(data, dict) and "landPlots" in data and isinstance(data["landPlots"], list):
                out.extend(data["landPlots"])
        except Exception:
            continue
    return out

def write_csv(rows, out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    fieldnames = [
        "Id", "sector", "District", "House number", "Town",
        "size", "Latitude", "Longitude", "rotation"
    ]
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"[OK] Wrote {len(rows)} rows -> {out_path}")

def normalize_rows(plots):
    """
    Map source keys to requested CSV columns and coerce types.
    Source keys observed: id, sector, district, houseNumber, town, size,
    latitude, longitude, rotationDegrees
    """
    out = []
    for p in plots:
        out.append({
            "Id": p.get("id"),
            "sector": p.get("sector"),
            "District": p.get("district"),
            "House number": p.get("houseNumber"),
            "Town": p.get("town"),
            "size": p.get("size"),
            "Latitude": p.get("latitude"),
            "Longitude": p.get("longitude"),
            "rotation": p.get("rotationDegrees"),
        })
    return out

def main():
    ap = argparse.ArgumentParser(description="Export Cornucopias landPlots to CSV.")
    ap.add_argument("--input", help="Path to saved game-maps HTML/JSON (e.g., game-maps.txt)")
    ap.add_argument("--url", help="Fetch live page (e.g., https://cornucopias.io/game-maps?map=solace-2)")
    ap.add_argument("--output", required=True, help="CSV output path")
    args = ap.parse_args()

    text = read_text_from_input(args.input, args.url)

    next_data = extract_next_data(text)
    if not next_data:
        # Fallback: try to snip the array directly if someone pasted only JSON
        m = re.search(r'"landPlots"\s*:\s*(\[[\s\S]*?\])', text, flags=re.IGNORECASE)
        if not m:
            print("[ERR] Could not find __NEXT_DATA__ or landPlots in the input.", file=sys.stderr)
            sys.exit(1)
        landplots = json.loads(m.group(1))
    else:
        landplots = extract_landplots_from_next(next_data)

    if not landplots:
        print("[ERR] landPlots array not found or empty.", file=sys.stderr)
        sys.exit(2)

    rows = normalize_rows(landplots)
    write_csv(rows, args.output)

if __name__ == "__main__":
    main()
