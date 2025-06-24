import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const chats = await db
      .collection("chats")
      .aggregate([
        {
          $match: {
            participants: new ObjectId(session.userId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participantDetails",
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "_id",
            foreignField: "chatId",
            as: "lastMessage",
            pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
          },
        },
        {
          $sort: { updatedAt: -1 },
        },
      ])
      .toArray()

    return NextResponse.json({ chats })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { participantId, isGroup, name } = await request.json()
    const db = await getDatabase()

    const chatData = {
      participants: isGroup
        ? [new ObjectId(session.userId), ...participantId.map((id: string) => new ObjectId(id))]
        : [new ObjectId(session.userId), new ObjectId(participantId)],
      isGroup: isGroup || false,
      name: name || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("chats").insertOne(chatData)

    return NextResponse.json({ chatId: result.insertedId })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 })
  }
}
