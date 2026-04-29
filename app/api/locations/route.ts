import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const synced = searchParams.get("synced");
    const empId = searchParams.get("emp_id");
    const limitParam = parseInt(searchParams.get("limit") || "500", 10);
    const offsetParam = parseInt(searchParams.get("offset") || "0", 10);

    const limit = Math.min(Math.max(1, limitParam), 1000);
    const offset = Math.max(0, offsetParam);

    const selectColumns = `
      id, session_id, emp_id, latitude, longitude,
      to_char(logged_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as logged_at,
      synced,
      to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
    `;

    let countResult;
    let dataResult;

    if (empId && (synced === "true" || synced === "false")) {
      const syncedBool = synced === "true";
      countResult = await sql`
        SELECT COUNT(*) as count FROM location_pings
        WHERE emp_id = ${empId} AND synced = ${syncedBool}
      `;
      dataResult = await sql.query(
        `SELECT ${selectColumns} FROM location_pings
         WHERE emp_id = $1 AND synced = $2
         ORDER BY logged_at ASC LIMIT $3 OFFSET $4`,
        [empId, syncedBool, limit, offset]
      );
    } else if (empId) {
      countResult = await sql`
        SELECT COUNT(*) as count FROM location_pings WHERE emp_id = ${empId}
      `;
      dataResult = await sql.query(
        `SELECT ${selectColumns} FROM location_pings
         WHERE emp_id = $1
         ORDER BY logged_at ASC LIMIT $2 OFFSET $3`,
        [empId, limit, offset]
      );
    } else if (synced === "true" || synced === "false") {
      const syncedBool = synced === "true";
      countResult = await sql`
        SELECT COUNT(*) as count FROM location_pings WHERE synced = ${syncedBool}
      `;
      dataResult = await sql.query(
        `SELECT ${selectColumns} FROM location_pings
         WHERE synced = $1
         ORDER BY logged_at ASC LIMIT $2 OFFSET $3`,
        [syncedBool, limit, offset]
      );
    } else {
      countResult = await sql`
        SELECT COUNT(*) as count FROM location_pings
      `;
      dataResult = await sql.query(
        `SELECT ${selectColumns} FROM location_pings
         ORDER BY logged_at ASC LIMIT $1 OFFSET $2`,
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
    console.error(`[${new Date().toISOString()}] GET /api/locations error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
