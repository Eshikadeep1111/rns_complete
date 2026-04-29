import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emp_id } = body;

    if (!emp_id || typeof emp_id !== "string" || emp_id.trim() === "") {
      return NextResponse.json(
        { success: false, error: "emp_id is required" },
        { status: 400 }
      );
    }

    // Check for existing active session
    const existing = await sql`
      SELECT id FROM sessions
      WHERE emp_id = ${emp_id} AND is_active = true
      LIMIT 1
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Employee ${emp_id} already has an active session`,
          existing_session_id: existing.rows[0].id,
        },
        { status: 409 }
      );
    }

    const result = await sql`
      INSERT INTO sessions (emp_id, check_in_time, is_active)
      VALUES (${emp_id}, NOW(), true)
      RETURNING
        id as session_id,
        emp_id,
        to_char(check_in_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as check_in_time,
        is_active
    `;

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/session/check-in error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
