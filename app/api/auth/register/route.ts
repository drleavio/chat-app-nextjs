
import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { encrypt } from "@/lib/auth"
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()
    console.log("Registration data:", { email, username });
    
    const db = await getDatabase()

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await db.collection("users").insertOne({
      email,
      username,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      createdAt: new Date(),
      lastSeen: new Date(),
      isOnline: false,
    })

    const session = await encrypt({
      userId: result.insertedId.toString(),
      email,
      username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    })

    const cookieStore = await cookies();
    cookieStore.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({
      user: {
        id: result.insertedId.toString(),
        email,
        username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      },
    })
  } catch (error) {
    console.log("Registration error:", error);
    
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
