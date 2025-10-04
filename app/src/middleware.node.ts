import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authUtils";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  console.log("[Middleware] Incoming request:", path);

  if (path.startsWith("/api/auth")) return NextResponse.next();

  if (path.startsWith("/api")) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 }
      );

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user)
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    console.log("[Middleware] Verified user:", user);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*"] };
