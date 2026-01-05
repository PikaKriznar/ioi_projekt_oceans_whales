import argparse
import json
from pathlib import Path

import numpy as np
import xarray as xr
import openvisuspy as ovp


def dedupe_preserve_order(seq):
    seen = set()
    out = []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--w_url", required=True)
    ap.add_argument("--latlon_nc", required=True)
    ap.add_argument("--out", default="data/vertical_flow_w_surface.json")
    ap.add_argument("--stride", type=int, default=6)
    ap.add_argument("--quality", type=int, default=-10)
    ap.add_argument("--nsteps", type=int, default=24)
    ap.add_argument("--time_start", type=int, default=0)
    ap.add_argument("--time_end", type=int, default=23)
    ap.add_argument("--min_lat", type=float, default=30.0)
    ap.add_argument("--max_lat", type=float, default=75.0)
    ap.add_argument("--min_lon", type=float, default=-35.0)
    ap.add_argument("--max_lon", type=float, default=40.0)
    args = ap.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    ds = xr.open_dataset(args.latlon_nc)
    lat_center = ds["latitude"].values
    lon_center = ds["longitude"].values

    # Handle lon convention (0..360) vs (-180..180)
    min_lon, max_lon = args.min_lon, args.max_lon
    if np.nanmax(lon_center) > 180 and min_lon < 0:
        min_lon = (min_lon + 360) % 360
        max_lon = (max_lon + 360) % 360

    # Compute bbox indices ONCE
    mask = (
        (lat_center >= args.min_lat) & (lat_center <= args.max_lat) &
        (lon_center >= min_lon) & (lon_center <= max_lon)
    )
    y_idx, x_idx = np.where(mask)
    if len(x_idx) == 0 or len(y_idx) == 0:
        raise ValueError("No grid points found in bbox. Check bbox and lon convention.")

    x_min, x_max = int(x_idx.min()), int(x_idx.max()) + 1
    y_min, y_max = int(y_idx.min()), int(y_idx.max()) + 1

    # Load dataset ONCE
    w_db = ovp.LoadDataset(args.w_url)

    # Sample time indices
    if args.nsteps <= 1:
        time_indices = [args.time_start]
    else:
        raw = np.linspace(args.time_start, args.time_end, args.nsteps)
        time_indices = [int(round(t)) for t in raw]
        time_indices = dedupe_preserve_order(time_indices)

    steps = []
    labels = []

    lat = lat_center[y_min:y_max, x_min:x_max]
    lon = lon_center[y_min:y_max, x_min:x_max]

    for i, t in enumerate(time_indices):
        print(f"[{i+1}/{len(time_indices)}] reading time={t} ...")

        w = w_db.db.read(
            time=t,
            x=[x_min, x_max],
            y=[y_min, y_max],
            z=[0, 1],
            quality=args.quality
        )[0, :, :]

        w_ds = w[::args.stride, ::args.stride]
        lat_ds = lat[::args.stride, ::args.stride]
        lon_ds = lon[::args.stride, ::args.stride]

        pts = []
        for ww, la, lo in zip(w_ds.ravel(), lat_ds.ravel(), lon_ds.ravel()):
            if np.isnan(ww) or np.isnan(la) or np.isnan(lo):
                continue
            pts.append({"lat": float(la), "lon": float(lo), "w": float(ww)})

        steps.append(pts)
        labels.append(f"time_index_{t}")

    payload = {"labels": labels, "steps": steps}
    out_path.write_text(json.dumps(payload), encoding="utf-8")
    print(f"Wrote {out_path} with {len(steps)} time steps.")


if __name__ == "__main__":
    main()
