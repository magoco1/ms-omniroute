import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function GET() {
  const dir = process.env.DATA_DIR || "/mnt/workspace/omniroute-data";
  let lastPing: string | null = null;
  try {
    lastPing = JSON.parse(fs.readFileSync(path.join(dir, "keepalive.json"), "utf8"))?.last_ping || null;
  } catch {}
  const ageSec = lastPing ? Math.round((Date.now() - new Date(lastPing).getTime()) / 1000) : null;
  return NextResponse.json({ alive: lastPing !== null, last_ping: lastPing, age_seconds: ageSec }, { headers: CORS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
