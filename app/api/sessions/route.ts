import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const empId = searchParams.get("emp_id");
    const isActive = searchParams.get("is_active");
    const limitParam = parseInt(searchParams.get("limit") || "100", 10);
    const offsetParam = parseInt(searchParams.get("offset") || "0", 10);

    const limit = Math.min(Math.max(1, limitParam), 1000);
    const offset = Math.max(0, offsetParam);

    const selectColumns = `
      id as session_id,
      emp_id,
      to_char(check_in_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as check_in_time,
      to_char(check_out_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as check_out_time,
      is_active,
      to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
    `;

    let countResult;
    let dataResult;

    if (empId && (isActive === "true" || isActive === "false")) {
      const activeBool = isActive === "true";
      countResult = await sql`
        SELECT COUNT(*) as count FROM sessions
        WHERE emp_id = ${empId} AND is_active = ${activeBool}
      `;
      dataResult = await sql.query(
        `SELECT ${selectColumns} FROM sessions
         WHERE emp_id = $1 AND is_active = $2
         ORDER BY check_in_time DESC LIMIT $3 OFFSET $4`,
        [empId, activeBool, limit, offset]
      );
    } else if (empId) {
      countResult = await sql`
        SELECT COUNT(*) as count FROM sessions WHERE emp_id = ${empId}
      `;
      dataResult = await sql.query(
        `SELECT ${selectColumns} FROM sessions
         WHERE emp_id = $1
         ORDER BY check_in_time DESC LIMIT $2 OFFSET $3`,
        [empId, limit, offset]
      );
    } else if (isActive === "true" || isActive === "false") {
      const activeBool = isActive === "true";
      countResult = await sql`
        SELECT COUNT(*) as count FROM sessions WHERE is_active = ${activeBool}
      `;
      dataResult = await sql.query(
        `SELECT ${selectColumns} FROM sessions
         WHERE is_active = $1
         ORDER BY check_in_time DESC LIMIT $2 OFFSET $3`,
        [activeBool, limit, offset]
      );
    } else {
      countResult = await sql`
        SELECT COUNT(*) as count FROM sessions
      `;
      dataResult = await sql.query(
        `SELECT ${selectColumns} FROM sessions
         ORDER BY check_in_time DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    }

    const total = parseInt(countResult.rows[0].count, 10);

    return NextResponse.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/sessions error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
