import { NextResponse } from "next/server";
import { buildClearCookieHeader } from "../../lib/auth";

export async function POST() {
  return NextResponse.json(
    { message: "Logged out" },
    { status: 200, headers: { "Set-Cookie": buildClearCookieHeader() } }
  );
}