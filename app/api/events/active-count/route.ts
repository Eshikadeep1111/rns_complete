import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // An alert is "active" when its SLA deadline is in the future (not yet expired).
    // This is used by the mobile background task to decide whether to send location pings.
    const result = await sql`
      SELECT COUNT(*)::int AS count
      FROM alerts
      WHERE sla_deadline > NOW()
    `;

    const count: number = result.rows[0].count;
    return NextResponse.json({ success: true, count, active: count > 0 });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/events/active-count error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
