import { NextRequest, NextResponse } from "next/server";

const backend = () => process.env.API_BASE_URL ?? "http://localhost:3001";

export async function POST(request: NextRequest) {
  const credentials: unknown = await request.json().catch(() => null);
  if (
    !credentials ||
    typeof credentials !== "object" ||
    !("email" in credentials) ||
    !("password" in credentials) ||
    typeof credentials.email !== "string" ||
    typeof credentials.password !== "string"
  ) {
    return NextResponse.json(
      { statusCode: 400, message: "Email and password are required" },
      { status: 400 },
    );
  }

  try {
    const login = await fetch(`${backend()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });
    const loginBody = await login.json();
    if (!login.ok) {
      return NextResponse.json(loginBody, { status: login.status });
    }
    if (typeof loginBody.accessToken !== "string") {
      return NextResponse.json(
        { statusCode: 502, message: "API returned an invalid login response" },
        { status: 502 },
      );
    }

    const profileResponse = await fetch(`${backend()}/auth/me`, {
      headers: { Authorization: `Bearer ${loginBody.accessToken}` },
      cache: "no-store",
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok) {
      return NextResponse.json(profile, { status: profileResponse.status });
    }

    const response = NextResponse.json(profile);
    response.cookies.set("transport_access", loginBody.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    return response;
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: "The API server is unavailable" },
      { status: 502 },
    );
  }
}
