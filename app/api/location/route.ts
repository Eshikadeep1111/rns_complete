import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, emp_id, latitude, longitude, location_source, logged_at } = body;
    const VALID_SOURCES = new Set(['GPS', 'WIFI', 'IP']);
    const resolvedSource: string = VALID_SOURCES.has(location_source) ? location_source : 'GPS';

    // Validation
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

    if (typeof latitude !== "number" || latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { success: false, error: "latitude must be a number between -90 and 90" },
        { status: 400 }
      );
    }

    if (typeof longitude !== "number" || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { success: false, error: "longitude must be a number between -180 and 180" },
        { status: 400 }
      );
    }

    if (!logged_at || isNaN(Date.parse(logged_at))) {
      return NextResponse.json(
        { success: false, error: "logged_at must be a valid ISO 8601 date string" },
        { status: 400 }
      );
    }

    // Verify session exists and is valid
    const session = await sql`
      SELECT id, emp_id, is_active FROM sessions
      WHERE id = ${session_id}
      LIMIT 1
    `;

    if (session.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    if (!session.rows[0].is_active) {
      return NextResponse.json(
        { success: false, error: "Session is no longer active. Employee is checked out." },
        { status: 403 }
      );
    }

    if (session.rows[0].emp_id !== emp_id) {
      return NextResponse.json(
        { success: false, error: "Employee ID does not match session" },
        { status: 403 }
      );
    }

    // Insert the location ping
    const result = await sql`
      INSERT INTO location_pings (session_id, emp_id, latitude, longitude, location_source, logged_at)
      VALUES (${session_id}, ${emp_id}, ${latitude}, ${longitude}, ${resolvedSource}, ${logged_at})
      RETURNING
        id,
        session_id,
        emp_id,
        latitude,
        longitude,
        location_source,
        to_char(logged_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as logged_at,
        synced,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
    `;

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/location error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
