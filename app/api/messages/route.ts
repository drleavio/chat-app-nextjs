import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("chatId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = 50

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID required" }, { status: 400 })
    }

    const db = await getDatabase()
    const messages = await db
      .collection("messages")
      .aggregate([
        {
          $match: { chatId: new ObjectId(chatId) },
        },
        {
          $lookup: {
            from: "users",
            localField: "senderId",
            foreignField: "_id",
            as: "sender",
          },
        },
        {
          $unwind: "$sender",
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
      ])
      .toArray()

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId, content, type = "text", mediaUrl } = await request.json()
    const db = await getDatabase()

    const message = {
      chatId: new ObjectId(chatId),
      senderId: new ObjectId(session.userId),
      content,
      type,
      mediaUrl: mediaUrl || null,
      createdAt: new Date(),
      readBy: [new ObjectId(session.userId)],
    }

    const result = await db.collection("messages").insertOne(message)

    // Update chat's last activity
    await db.collection("chats").updateOne({ _id: new ObjectId(chatId) }, { $set: { updatedAt: new Date() } })

    return NextResponse.json({ messageId: result.insertedId })
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
