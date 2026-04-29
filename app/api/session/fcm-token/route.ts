import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const emp_id = request.nextUrl.searchParams.get("emp_id");

    if (!emp_id || emp_id.trim() === "") {
      return NextResponse.json(
        { success: false, error: "emp_id query parameter is required" },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT fcm_token
      FROM sessions
      WHERE emp_id = ${emp_id} AND is_active = true
      ORDER BY check_in_time DESC
      LIMIT 1
    `;

    const fcm_token: string | null =
      result.rows.length > 0 ? (result.rows[0].fcm_token ?? null) : null;

    return NextResponse.json({ success: true, fcm_token });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/session/fcm-token error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
