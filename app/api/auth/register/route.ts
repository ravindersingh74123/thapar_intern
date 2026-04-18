// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../lib/mongodb";
import User from "../../lib/models/User";
import { signToken, buildSetCookieHeader } from "../../lib/auth";

const adminapssword = process.env.adminapssword!;

export async function POST(req: NextRequest) {
  try {
    const { name, email, password ,adminpass } = await req.json();

    if (!name || !email || !password || !adminpass) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    if(adminpass!=adminapssword){
        return NextResponse.json({ error: "Incorrect Admin Password" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);
    
    const user = await User.create({ name, email, password: hash});

    const token = signToken({ userId: String(user._id), email: user.email, name: user.name });

    return NextResponse.json(
      { message: "Account created", user: { name: user.name, email: user.email } },
      { status: 201, headers: { "Set-Cookie": buildSetCookieHeader(token) } }
    );
  } catch (err) {
    console.error("[/api/auth/register]", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}