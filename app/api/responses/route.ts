import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const VALID_RESPONSES = new Set(["Safe", "Need Help", "Unable to Respond"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, alertId, responseText, timestamp, latitude, longitude } = body;

    if (!employeeId || typeof employeeId !== "string" || employeeId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "employeeId is required" },
        { status: 400 }
      );
    }

    if (!alertId || typeof alertId !== "number") {
      return NextResponse.json(
        { success: false, error: "alertId is required and must be a number" },
        { status: 400 }
      );
    }

    if (!responseText || !VALID_RESPONSES.has(responseText)) {
      return NextResponse.json(
        { success: false, error: "responseText must be one of: Safe, Need Help, Unable to Respond" },
        { status: 400 }
      );
    }

    if (!timestamp || isNaN(Date.parse(timestamp))) {
      return NextResponse.json(
        { success: false, error: "timestamp must be a valid ISO 8601 date string" },
        { status: 400 }
      );
    }

    if (latitude !== null && latitude !== undefined) {
      if (typeof latitude !== "number" || latitude < -90 || latitude > 90) {
        return NextResponse.json(
          { success: false, error: "latitude must be a number between -90 and 90" },
          { status: 400 }
        );
      }
    }

    if (longitude !== null && longitude !== undefined) {
      if (typeof longitude !== "number" || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { success: false, error: "longitude must be a number between -180 and 180" },
          { status: 400 }
        );
      }
    }

    // Verify alert exists, belongs to employee, and fetch sla_deadline for is_late computation
    const alert = await sql`
      SELECT id, sla_deadline FROM alerts
      WHERE id = ${alertId} AND emp_id = ${employeeId.trim()}
      LIMIT 1
    `;

    if (alert.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Alert not found or not assigned to this employee" },
        { status: 404 }
      );
    }

    const slaDeadline = alert.rows[0].sla_deadline as Date;
    const respondedAt = new Date(timestamp);
    // Compute server-side: response is late if it arrived after the SLA deadline
    const isLate = respondedAt > slaDeadline;

    const lat = latitude ?? null;
    const lng = longitude ?? null;

    const result = await sql`
      INSERT INTO alert_responses (alert_id, emp_id, response_text, responded_at, latitude, longitude, is_late)
      VALUES (
        ${alertId},
        ${employeeId.trim()},
        ${responseText},
        ${timestamp},
        ${lat},
        ${lng},
        ${isLate}
      )
      RETURNING
        id,
        alert_id,
        emp_id,
        response_text,
        to_char(responded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS responded_at,
        latitude,
        longitude,
        is_late,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
    `;

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/responses error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
