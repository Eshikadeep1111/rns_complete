import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    // Validation
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "ids must be a non-empty array of numbers" },
        { status: 400 }
      );
    }

    if (ids.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Maximum 1000 ids per request" },
        { status: 400 }
      );
    }

    if (!ids.every((id: unknown) => typeof id === "number" && Number.isInteger(id))) {
      return NextResponse.json(
        { success: false, error: "All ids must be integers" },
        { status: 400 }
      );
    }

    // Build parameterized query for IN clause
    const placeholders = ids.map((_: number, i: number) => `$${i + 1}`).join(", ");
    const query = `UPDATE location_pings SET synced = true WHERE id IN (${placeholders})`;

    const result = await sql.query(query, ids);

    return NextResponse.json({
      success: true,
      updated: result.rowCount,
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] PATCH /api/locations/mark-synced error:`,
      error
    );
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
