import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, emp_id } = body;

    if (!session_id || typeof session_id !== "number") {
      return NextResponse.json(
        { success: false, error: "session_id is required and must be a number" },
        { status: 400 }
      );
    }

    if (!emp_id || typeof emp_id !== "string" || emp_id.trim() === "") {
      return NextResponse.json(
        { success: false, error: "emp_id is required" },
        { status: 400 }
      );
    }

    // Find active session matching both session_id and emp_id
    const session = await sql`
      SELECT id FROM sessions
      WHERE id = ${session_id} AND emp_id = ${emp_id} AND is_active = true
      LIMIT 1
    `;

    if (session.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active session found" },
        { status: 404 }
      );
    }

    // Close the session
    const result = await sql`
      UPDATE sessions
      SET check_out_time = NOW(), is_active = false
      WHERE id = ${session_id}
      RETURNING
        id as session_id,
        emp_id,
        to_char(check_in_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as check_in_time,
        to_char(check_out_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as check_out_time,
        is_active
    `;

    // Count total pings for this session
    const pingCount = await sql`
      SELECT COUNT(*) as count FROM location_pings
      WHERE session_id = ${session_id}
    `;

    const data = {
      ...result.rows[0],
      total_pings: parseInt(pingCount.rows[0].count, 10),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/session/check-out error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
