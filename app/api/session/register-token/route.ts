import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, emp_id, fcm_token } = body;

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

    if (!fcm_token || typeof fcm_token !== "string" || fcm_token.trim() === "") {
      return NextResponse.json(
        { success: false, error: "fcm_token is required" },
        { status: 400 }
      );
    }

    // Ensure column exists (idempotent — safe to run on every deploy)
    await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS fcm_token TEXT`;

    const result = await sql`
      UPDATE sessions
      SET fcm_token = ${fcm_token}
      WHERE id = ${session_id} AND emp_id = ${emp_id} AND is_active = true
    `;

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "No active session found for the given session_id and emp_id" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/session/register-token error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
