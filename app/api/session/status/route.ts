import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get("emp_id");

    if (!empId || empId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "emp_id query parameter is required" },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT
        id as session_id,
        emp_id,
        to_char(check_in_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as check_in_time,
        is_active
      FROM sessions
      WHERE emp_id = ${empId} AND is_active = true
      LIMIT 1
    `;

    if (result.rows.length > 0) {
      return NextResponse.json({
        success: true,
        has_active_session: true,
        data: result.rows[0],
      });
    }

    return NextResponse.json({
      success: true,
      has_active_session: false,
      data: null,
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/session/status error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
