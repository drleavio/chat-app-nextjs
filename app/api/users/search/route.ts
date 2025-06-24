import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ users: [] })
    }

    const db = await getDatabase()
    const users = await db
      .collection("users")
      .find({
        $and: [
          { _id: { $ne: session.userId } },
          {
            $or: [{ username: { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }],
          },
        ],
      })
      .project({ password: 0 })
      .limit(10)
      .toArray()

    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
