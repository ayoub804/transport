import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const backend = process.env.API_BASE_URL ?? "http://localhost:3001";
  try {
    const response = await fetch(`${backend}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
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
