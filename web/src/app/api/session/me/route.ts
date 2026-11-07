import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("transport_access")?.value;
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Authentication required" },
      { status: 401 },
    );
  }
  const backend = process.env.API_BASE_URL ?? "http://localhost:3001";
  try {
    const response = await fetch(`${backend}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return NextResponse.json(await response.json(), {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: "The API server is unavailable" },
      { status: 502 },
    );
  }
}
