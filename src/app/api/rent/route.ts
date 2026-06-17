import { NextRequest, NextResponse } from "next/server";
import type { CountryCode } from "@/lib/countries/types";
import { snapshotFor, CITY_SNAPSHOT } from "@/lib/data/cityData";

/**
 * GET /api/rent?city=Austin&region=TX&country=US
 * Live path: RentCast market data (cached). Fallback: bundled snapshot.
 * Always returns a usable answer with provenance - never 500s the UX.
 */

// Simple in-memory cache (per server instance). Keyed by city|region|country.
// Protects the free RentCast tier from repeated demo hits.
const cache = new Map<string, { rentMonthly: number; ts: number }>();
const TTL = 1000 * 60 * 60 * 24; // 24h

async function fetchRentCast(
  city: string,
  region: string,
): Promise<number | null> {
  const key = process.env.RENTCAST_API_KEY;
  if (!key) return null;
  try {
    // RentCast market data by city/state. (Endpoint shape per their docs.)
    const url = `https://api.rentcast.io/v1/markets?city=${encodeURIComponent(city)}&state=${encodeURIComponent(region)}&dataType=rental`;
    const res = await fetch(url, {
      headers: { "X-Api-Key": key, Accept: "application/json" },
      // edge-cache for a day
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    // Defensive extraction - shape varies; look for an average 1BR / overall rent.
    const j = json as Record<string, unknown>;
    const rental = (j.rentalData ?? j) as Record<string, unknown>;
    const avg =
      (rental.averageRent as number) ??
      (rental.medianRent as number) ??
      (
        (rental.detailedData as Record<string, unknown>)?.["1"] as Record<
          string,
          number
        >
      )?.averageRent;
    return typeof avg === "number" && avg > 200 ? Math.round(avg) : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const city = sp.get("city") ?? "";
  const country = (sp.get("country") as CountryCode) ?? "US";
  const region = sp.get("region") ?? CITY_SNAPSHOT[city]?.region ?? "";

  const base = snapshotFor(city, country, region);

  // Cache check
  const ck = `${city}|${region}|${country}`;
  const cached = cache.get(ck);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json({
      ...base,
      rentMonthly: cached.rentMonthly,
      rentSource: "live",
    });
  }

  // RentCast is US-focused; only attempt for US. Canada uses snapshot.
  let live: number | null = null;
  if (country === "US") live = await fetchRentCast(city, region);

  if (live) {
    cache.set(ck, { rentMonthly: live, ts: Date.now() });
    return NextResponse.json({
      ...base,
      rentMonthly: live,
      rentSource: "live",
    });
  }

  // Fallback: snapshot or regional estimate (already in `base`)
  return NextResponse.json(base);
}
