import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        userId: session.userId,
        email: session.email,
        username: session.username,
        avatar: session.avatar,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Session invalid" }, { status: 401 })
  }
}
