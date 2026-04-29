import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const createdSince = searchParams.get("created_since"); // ISO timestamp
    const limitParam = parseInt(searchParams.get("limit") || "500", 10);
    const offsetParam = parseInt(searchParams.get("offset") || "0", 10);

    const limit = Math.min(Math.max(1, limitParam), 1000);
    const offset = Math.max(0, offsetParam);

    let countResult;
    let dataResult;

    if (createdSince) {
      countResult = await sql`
        SELECT COUNT(*) as count FROM alerts
        WHERE created_at >= ${createdSince}::timestamptz
      `;
      dataResult = await sql.query(
        `SELECT
           id,
           emp_id,
           title,
           description,
           severity,
           required_action,
           sla_deadline,
           to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
         FROM alerts
         WHERE created_at >= $1::timestamptz
         ORDER BY created_at ASC
         LIMIT $2 OFFSET $3`,
        [createdSince, limit, offset]
      );
    } else {
      countResult = await sql`
        SELECT COUNT(*) as count FROM alerts
      `;
      dataResult = await sql.query(
        `SELECT
           id,
           emp_id,
           title,
           description,
           severity,
           required_action,
           sla_deadline,
           to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
         FROM alerts
         ORDER BY created_at ASC
         LIMIT $1 OFFSET $2`,
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
    console.error(`[${new Date().toISOString()}] GET /api/sync/alerts error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
