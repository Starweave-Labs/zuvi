#!/usr/bin/env python3
"""Generate the bundled globe land rings from public-domain Natural Earth 4.1.0.

Download the original archive into its own NEW, EMPTY directory and retain it:
  source_dir=$(mktemp -d /tmp/zuvi-globe-natural-earth.XXXXXX)
  curl --fail --location https://naturalearth.s3.amazonaws.com/110m_physical/ne_110m_land.zip \
    -o "$source_dir/ne_110m_land.zip"
Then, from the repository (never from the downloaded directory):
  python3 -I scripts/preprocess-globe-geography.py "$source_dir/ne_110m_land.zip" \
    packages/ui/src/components/Globe/globe-geography.ts

No package dependencies or code from the archive are used. The archive stays
intact. Only polygon coordinate records are read; country/political data is not.
"""

import argparse
import hashlib
import math
from pathlib import Path
import struct
import zipfile

SOURCE_URL = "https://naturalearth.s3.amazonaws.com/110m_physical/ne_110m_land.zip"
SOURCE_SHA256 = "1926c621afd6ac67c3f36639bb1236134a48d82226dc675d3e3df53d02d2a3de"
LICENSE_URL = "https://www.naturalearthdata.com/about/terms-of-use/"


def signed_area(ring):
    return sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:] + ring[:1])) / 2


def contains(ring, point):
    x, y = point
    inside = False
    previous = ring[-1]
    for current in ring:
        ax, ay = previous
        bx, by = current
        if (ay > y) != (by > y) and x < (bx - ax) * (y - ay) / (by - ay) + ax:
            inside = not inside
        previous = current
    return inside


def read_polygons(archive_path):
    raw = archive_path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != SOURCE_SHA256:
        raise ValueError(f"Expected pinned Natural Earth archive {SOURCE_SHA256}, got {digest}")
    with zipfile.ZipFile(archive_path) as archive:
        info = archive.getinfo("ne_110m_land.shp")
        if info.file_size > 16 * 1024 * 1024:
            raise ValueError("Shapefile exceeds the input budget")
        data = archive.read(info)
        version = archive.read("ne_110m_land.VERSION.txt").decode("utf-8").strip()
    if len(data) < 100 or struct.unpack_from(">i", data, 0)[0] != 9994:
        raise ValueError("Not an ESRI shapefile")
    if struct.unpack_from("<ii", data, 28) != (1000, 5):
        raise ValueError("Expected the Polygon shape type")
    if struct.unpack_from(">i", data, 24)[0] * 2 != len(data):
        raise ValueError("Shapefile length mismatch")
    polygons = []
    offset = 100
    source_points = 0
    while offset < len(data):
        if offset + 8 > len(data):
            raise ValueError("Truncated record header")
        length = struct.unpack_from(">i", data, offset + 4)[0] * 2
        record = offset + 8
        end = record + length
        if length < 44 or end > len(data) or struct.unpack_from("<i", data, record)[0] != 5:
            raise ValueError("Invalid polygon record")
        part_count, point_count = struct.unpack_from("<ii", data, record + 36)
        if not 0 < part_count <= 10000 or not 0 < point_count <= 100000:
            raise ValueError("Invalid polygon size")
        coordinates_offset = record + 44 + part_count * 4
        if coordinates_offset + point_count * 16 != end:
            raise ValueError("Coordinate record length mismatch")
        starts = list(struct.unpack_from(f"<{part_count}i", data, record + 44)) + [point_count]
        if starts[0] != 0 or any(a >= b for a, b in zip(starts, starts[1:])):
            raise ValueError("Invalid polygon parts")
        coordinates = [struct.unpack_from("<dd", data, coordinates_offset + i * 16) for i in range(point_count)]
        if any(not math.isfinite(lon) or not math.isfinite(lat) or abs(lon) > 180.001 or abs(lat) > 90.001
               for lon, lat in coordinates):
            raise ValueError("Invalid geographic coordinate")
        source_points += point_count
        outers = []
        holes = []
        for a, b in zip(starts, starts[1:]):
            source_ring = coordinates[a:b]
            area = signed_area(source_ring)
            ring = []
            for lon, lat in source_ring:
                point = (round(max(-180, min(180, lon)), 2), round(max(-90, min(90, lat)), 2))
                if not ring or point != ring[-1]:
                    ring.append(point)
            if len(ring) > 1 and ring[0] == ring[-1]:
                ring.pop()
            if len(ring) < 3:
                continue
            # ESRI exteriors wind clockwise; holes wind counterclockwise.
            if area < 0:
                outers.append([ring])
            else:
                holes.append(ring)
        for hole in holes:
            owner = next((polygon for polygon in outers if contains(polygon[0], hole[0])), None)
            if owner is None:
                raise ValueError("Hole has no containing exterior")
            owner.append(hole)
        polygons.extend(outers)
        offset = end
    return polygons, version, source_points


HELPERS = """
/** Coast rings share the polygon coordinate arrays, without a second world dataset.
 * Antarctica includes two source polar closure vertices; ignore edges at ±180°
 * or -90° when stroking coastlines (these are map seams, not physical coast).
 */
export const GLOBE_COASTLINES: readonly GlobeGeographicRing[] = GLOBE_LAND_POLYGONS.flatMap((polygon) => polygon);

let landDots: readonly number[] | undefined;

/** Roughly 3,000 equal-area land dots, calculated only on demand and cached. */
export function getLandDots(): readonly number[] {
  if (landDots) return landDots;
  const bounds = GLOBE_LAND_POLYGONS.map((polygon) => {
    let west = 180, east = -180, south = 90, north = -90;
    for (let i = 0; i < polygon[0].length; i += 2) {
      west = Math.min(west, polygon[0][i]);
      east = Math.max(east, polygon[0][i]);
      south = Math.min(south, polygon[0][i + 1]);
      north = Math.max(north, polygon[0][i + 1]);
    }
    return { polygon, west, east, south, north };
  });
  const contains = (ring: GlobeGeographicRing, lon: number, lat: number): boolean => {
    let inside = false;
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
      const ax = ring[j], ay = ring[j + 1], bx = ring[i], by = ring[i + 1];
      if ((ay > lat) !== (by > lat) && lon < (bx - ax) * (lat - ay) / (by - ay) + ax) inside = !inside;
    }
    return inside;
  };
  const dots: number[] = [];
  const samples = 10500;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < samples; i++) {
    const lat = Math.asin(1 - 2 * (i + 0.5) / samples) * 180 / Math.PI;
    const lon = ((i * goldenAngle * 180 / Math.PI) % 360) - 180;
    for (const { polygon, west, east, south, north } of bounds) {
      if (lon < west || lon > east || lat < south || lat > north || !contains(polygon[0], lon, lat)) continue;
      if (polygon.slice(1).some((hole) => contains(hole, lon, lat))) continue;
      dots.push(lon, lat);
      break;
    }
  }
  landDots = dots;
  return landDots;
}
"""


def format_number(value):
    return f"{value:.2f}".rstrip("0").rstrip(".") if value != 0 else "0"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    polygons, version, source_points = read_polygons(args.archive)
    output = [
        "/**",
        " * Generated with scripts/preprocess-globe-geography.py; do not hand-edit coordinates.",
        f" * Natural Earth ne_110m_land {version}, 1:110m physical land (no country borders).",
        f" * Source: {SOURCE_URL}",
        f" * Public domain: {LICENSE_URL}",
        f" * Original ZIP SHA-256: {SOURCE_SHA256}",
        " * All original rings retained; rounded to 0.01°, adjacent duplicates removed.",
        " */",
        "export type GlobeGeographicRing = readonly number[]; // flat [longitude, latitude, ...]",
        "export type GlobeLandPolygon = readonly GlobeGeographicRing[]; // exterior, then holes",
        "",
        "export const GLOBE_GEOGRAPHY_SOURCE = {",
        f"  url: '{SOURCE_URL}',",
        f"  licenseUrl: '{LICENSE_URL}',",
        "  license: 'Public domain',",
        f"  version: '{version}',",
        f"  sha256: '{SOURCE_SHA256}',",
        "} as const;",
        "",
        "export const GLOBE_LAND_POLYGONS: readonly GlobeLandPolygon[] = [",
    ]
    for polygon in polygons:
        output.append("  [")
        for ring in polygon:
            flat = [format_number(value) for point in ring for value in point]
            output.append("    [")
            for i in range(0, len(flat), 20):
                output.append("      " + ",".join(flat[i:i + 20]) + ",")
            output.append("    ],")
        output.append("  ],")
    output.extend([
        "];",
        HELPERS.strip(),
        "",
    ])
    args.output.write_text("\n".join(output), encoding="utf-8")
    point_count = sum(len(ring) for polygon in polygons for ring in polygon)
    print(f"Natural Earth {version}: {len(polygons)} polygons, {source_points} source coordinates, {point_count} retained")
    print(f"Wrote {args.output.resolve()} ({args.output.stat().st_size} bytes)")
    print(f"Original retained at {args.archive.resolve()}")


if __name__ == "__main__":
    main()
