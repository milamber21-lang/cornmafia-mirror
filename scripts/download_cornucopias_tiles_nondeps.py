#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, time, argparse, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

OUT_ROOT = "/home/lilyserver/docker/cm/data/maps"
BASE_URL = "https://s3images.cornucopias.io/maps"
DEFAULT_LOCATIONS = ["solace-1", "solace-2", "solace-3"]

DEFAULT_WORKERS = 8
RETRIES = 5
BACKOFF = 0.6
TIMEOUT = 20

HEADERS = {
    "User-Agent": "cornucopias-tile-fetcher/0.2 (stdlib)",
    "Referer": "https://cornucopias.io",
    "Accept": "*/*",
}

def tile_range(z: int):
    max_index = (1 << z) - 1
    return range(0, max_index + 1), range(0, max_index + 1)

def fetch_tile(location: str, z: int, x: int, y: int):
    url = f"{BASE_URL}/{location}/{z}/{x}/{y}.png"  # <-- .png added
    out_dir = os.path.join(OUT_ROOT, location, str(z), str(x))
    out_png = os.path.join(out_dir, f"{y}.png")
    miss_flag = out_png + ".missing"

    if os.path.exists(out_png) or os.path.exists(miss_flag):
        return True

    os.makedirs(out_dir, exist_ok=True)
    req = urllib.request.Request(url, headers=HEADERS)

    for attempt in range(1, RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                data = resp.read()
                if not data:
                    raise RuntimeError("Empty response body")
                with open(out_png, "wb") as f:
                    f.write(data)
                return True
        except urllib.error.HTTPError as e:
            if e.code in (404, 410):
                open(miss_flag, "w").close()
                return False
        except Exception:
            pass
        time.sleep(BACKOFF * attempt)

    print(f"[WARN] Failed after retries: {url}")
    return False

def make_jobs(locations, zmin, zmax):
    for location in locations:
        for z in range(zmin, zmax + 1):
            xs, ys = tile_range(z)
            for x in xs:
                for y in ys:
                    yield (location, z, x, y)

def main():
    ap = argparse.ArgumentParser(description="Download Cornucopias map tiles (no external deps).")
    ap.add_argument("--locations", nargs="+", default=DEFAULT_LOCATIONS)
    ap.add_argument("--zmin", type=int, default=0)
    ap.add_argument("--zmax", type=int, default=6)
    ap.add_argument("--workers", type=int, default=DEFAULT_WORKERS)
    args = ap.parse_args()

    if args.zmin < 0 or args.zmax < args.zmin or args.zmax > 6:
        raise SystemExit("Zooms must be within 0..6 and zmax >= zmin.")
    os.makedirs(OUT_ROOT, exist_ok=True)

    jobs = list(make_jobs(args.locations, args.zmin, args.zmax))
    total = len(jobs)
    print(f"[INFO] Total tiles to check: {total} (locations={args.locations}, z={args.zmin}..{args.zmax}, workers={args.workers})")

    done = ok = 0
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = {ex.submit(fetch_tile, *job): job for job in jobs}
        for fut in as_completed(futs):
            done += 1
            try:
                if fut.result():
                    ok += 1
            except Exception:
                pass
            if done % 1000 == 0 or done == total:
                print(f"[INFO] Progress: {done}/{total} ({ok} saved)")

if __name__ == "__main__":
    main()
