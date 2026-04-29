import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId || employeeId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "employeeId query parameter is required" },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT
        a.id,
        a.emp_id,
        a.title,
        a.description,
        a.severity,
        a.required_action,
        to_char(a.sla_deadline AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS sla_deadline,
        to_char(a.created_at  AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
      FROM alerts a
      WHERE a.emp_id = ${employeeId.trim()}
        AND NOT EXISTS (
          SELECT 1 FROM alert_responses ar
          WHERE ar.alert_id = a.id
            AND ar.emp_id   = ${employeeId.trim()}
        )
      ORDER BY a.sla_deadline ASC
    `;

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/alerts/active error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
