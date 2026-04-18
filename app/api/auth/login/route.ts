// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../lib/mongodb";
import User from "../../lib/models/User";
import { signToken, buildSetCookieHeader } from "../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signToken({ userId: String(user._id), email: user.email, name: user.name });

    return NextResponse.json(
      { message: "Logged in", user: { name: user.name, email: user.email } },
      { status: 200, headers: { "Set-Cookie": buildSetCookieHeader(token) } }
    );
  } catch (err) {
    console.error("[/api/auth/login]", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}