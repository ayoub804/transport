import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  const token = request.cookies.get("transport_access")?.value;
  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Authentication required" },
      { status: 401 },
    );
  }

  const { path } = await context.params;
  const backend = process.env.API_BASE_URL ?? "http://localhost:3001";
  const target = new URL(`${backend.replace(/\/$/, "")}/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
    const responseBody = await response.arrayBuffer();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: "The API server is unavailable" },
      { status: 502 },
    );
  }
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PATCH,
  proxy as PUT,
  proxy as DELETE,
};
