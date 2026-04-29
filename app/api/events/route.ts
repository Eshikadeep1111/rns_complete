import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const result = status
      ? await sql`
          SELECT * FROM events
          WHERE LOWER(status) = LOWER(${status})
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : await sql`
          SELECT * FROM events
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET /api/events error:`, error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      event_type,
      severity,
      area_type = "RADIUS",
      affected_lat,
      affected_lng,
      affected_radius_meters,
      polygon_coordinates,
      response_deadline_seconds = 300,
      trigger_source = "manual",
      created_by,
      sla_deadline,
    } = body;

    if (!title || !event_type || !severity) {
      return NextResponse.json(
        { success: false, error: "title, event_type, and severity are required" },
        { status: 400 }
      );
    }

    const resolvedAreaType = (area_type as string).toUpperCase();

    if (resolvedAreaType === "POLYGON") {
      if (!polygon_coordinates) {
        return NextResponse.json(
          { success: false, error: "polygon_coordinates is required for POLYGON area_type" },
          { status: 400 }
        );
      }
    } else {
      if (affected_lat == null || affected_lng == null || affected_radius_meters == null) {
        return NextResponse.json(
          { success: false, error: "affected_lat, affected_lng, affected_radius_meters are required for RADIUS area_type" },
          { status: 400 }
        );
      }
    }

    const result = await sql`
      INSERT INTO events (
        title, description, event_type, severity,
        area_type, affected_lat, affected_lng, affected_radius_meters, polygon_coordinates,
        response_deadline_seconds, status, trigger_source, created_by,
        sla_deadline, activated_at
      ) VALUES (
        ${title}, ${description ?? null}, ${event_type}, ${severity},
        ${resolvedAreaType}, ${affected_lat ?? null}, ${affected_lng ?? null},
        ${affected_radius_meters ?? null}, ${polygon_coordinates ?? null},
        ${response_deadline_seconds}, 'ACTIVE', ${trigger_source}, ${created_by ?? null},
        ${sla_deadline ?? null}, NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] POST /api/events error:`, error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
