// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { buildClearCookieHeader } from "../../lib/auth";

export async function POST() {
  return NextResponse.json(
    { message: "Logged out" },
    { status: 200, headers: { "Set-Cookie": buildClearCookieHeader() } }
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// app/api/auth/me/route.ts  (put this in a separate file: app/api/auth/me/route.ts)
// ─────────────────────────────────────────────────────────────────────────────
// import { NextRequest, NextResponse } from "next/server";
// import { getSessionFromRequest } from "../../lib/auth";
//
// export async function GET(req: NextRequest) {
//   const session = getSessionFromRequest(req);
//   if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//   return NextResponse.json({ user: { name: session.name, email: session.email } });
// }