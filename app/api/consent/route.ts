import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, granted, permissionType, reason, timestamp, deviceInfo } = body;

    if (!employeeId || typeof employeeId !== "string" || employeeId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "employeeId is required" },
        { status: 400 }
      );
    }

    if (typeof granted !== "boolean") {
      return NextResponse.json(
        { success: false, error: "granted must be a boolean" },
        { status: 400 }
      );
    }

    if (!permissionType || typeof permissionType !== "string" || permissionType.trim() === "") {
      return NextResponse.json(
        { success: false, error: "permissionType is required" },
        { status: 400 }
      );
    }

    if (!timestamp || isNaN(Date.parse(timestamp))) {
      return NextResponse.json(
        { success: false, error: "timestamp must be a valid ISO 8601 date string" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO consent_logs (employee_id, granted, permission_type, reason, timestamp, device_info)
      VALUES (
        ${employeeId.trim()},
        ${granted},
        ${permissionType.trim()},
        ${reason ?? null},
        ${timestamp},
        ${deviceInfo ?? null}
      )
      RETURNING id, employee_id, granted, permission_type, reason,
        to_char(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS timestamp,
        device_info, synced,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
    `;

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/consent error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const syncedParam = searchParams.get("synced");

    let result;
    if (syncedParam === "false") {
      result = await sql`
        SELECT id, employee_id, granted, permission_type, reason,
          to_char(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS timestamp,
          device_info, synced,
          to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
        FROM consent_logs
        WHERE synced = FALSE
        ORDER BY created_at ASC
      `;
    } else {
      result = await sql`
        SELECT id, employee_id, granted, permission_type, reason,
          to_char(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS timestamp,
          device_info, synced,
          to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
        FROM consent_logs
        ORDER BY created_at DESC
      `;
    }

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/consent error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
