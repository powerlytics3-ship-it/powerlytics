import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const callbackUrl = encodeURIComponent(new URL("/login", request.url).toString());
  return NextResponse.redirect(new URL(`/api/auth/signout?callbackUrl=${callbackUrl}`, request.url));
}
