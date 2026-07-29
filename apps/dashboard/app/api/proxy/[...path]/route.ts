import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const API_URL = process.env.FASTAPI_URL || "http://fastapi:8000";

async function proxyRequest(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Extract the path after /api/proxy/
  const url = new URL(request.url);
  const proxyPath = url.pathname.replace(/^\/api\/proxy/, "");
  const targetUrl = `${API_URL}${proxyPath}${url.search}`;

  const headers = new Headers();
  headers.set("Content-Type", request.headers.get("Content-Type") || "application/json");
  headers.set("X-Forwarded-For", request.headers.get("x-forwarded-for") || "unknown");

  if (token) {
    // Forward the raw JWT to FastAPI
    const jwt = request.cookies.get("next-auth.session-token")?.value;
    if (jwt) {
      headers.set("Authorization", `Bearer ${jwt}`);
    }
  }

  // Forward request ID from Caddy
  const requestId = request.headers.get("X-Request-ID");
  if (requestId) {
    headers.set("X-Request-ID", requestId);
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    fetchOptions.body = await request.text();
  }

  const response = await fetch(targetUrl, fetchOptions);
  const data = await response.text();

  return new NextResponse(data, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json",
      "X-Request-ID": response.headers.get("X-Request-ID") || "",
    },
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
