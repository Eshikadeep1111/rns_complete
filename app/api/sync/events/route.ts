import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");           // e.g. "active"
    const createdSince = searchParams.get("created_since"); // ISO timestamp
    const limitParam = parseInt(searchParams.get("limit") || "100", 10);
    const offsetParam = parseInt(searchParams.get("offset") || "0", 10);

    const limit = Math.min(Math.max(1, limitParam), 500);
    const offset = Math.max(0, offsetParam);

    let countResult;
    let dataResult;

    if (status && createdSince) {
      countResult = await sql`
        SELECT COUNT(*) as count FROM events
        WHERE LOWER(status) = LOWER(${status})
          AND created_at >= ${createdSince}::timestamptz
      `;
      dataResult = await sql.query(
        `SELECT * FROM events
         WHERE LOWER(status) = LOWER($1)
           AND created_at >= $2::timestamptz
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4`,
        [status, createdSince, limit, offset]
      );
    } else if (status) {
      countResult = await sql`
        SELECT COUNT(*) as count FROM events
        WHERE LOWER(status) = LOWER(${status})
      `;
      dataResult = await sql.query(
        `SELECT * FROM events
         WHERE LOWER(status) = LOWER($1)
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      );
    } else if (createdSince) {
      countResult = await sql`
        SELECT COUNT(*) as count FROM events
        WHERE created_at >= ${createdSince}::timestamptz
      `;
      dataResult = await sql.query(
        `SELECT * FROM events
         WHERE created_at >= $1::timestamptz
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [createdSince, limit, offset]
      );
    } else {
      countResult = await sql`
        SELECT COUNT(*) as count FROM events
      `;
      dataResult = await sql.query(
        `SELECT * FROM events
         ORDER BY created_at DESC
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
    console.error(`[${new Date().toISOString()}] GET /api/sync/events error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}


