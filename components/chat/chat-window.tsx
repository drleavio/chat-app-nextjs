"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, ImageIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Message {
  _id: string
  content: string
  type: "text" | "image"
  mediaUrl?: string
  createdAt: string
  sender: {
    _id: string
    username: string
    avatar: string
  }
}

interface ChatWindowProps {
  chatId: string
  currentUser: any
}

export default function ChatWindow({ chatId, currentUser }: ChatWindowProps) {
  console.log("ChatWindow props:", { chatId, currentUser });
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (chatId) {
      fetchMessages()
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?chatId=${chatId}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched messages:", data.messages);
        
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async (content: string, type: "text" | "image" = "text", mediaUrl?: string) => {
    if (!content.trim() && type === "text") return

    setLoading(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          content,
          type,
          mediaUrl,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        fetchMessages()
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(newMessage)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        sendMessage("Image", "image", data.url)
      }
    } catch (error) {
      console.error("Failed to upload image:", error)
    }
  }

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Chat</h3>
          <p className="text-gray-500">Select a chat to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${message.sender.username === currentUser.username ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                message.sender._id === currentUser.userId ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={message.sender.avatar || "/placeholder.svg"} />
                <AvatarFallback>{message.sender.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <Card
                className={`p-3 ${message.sender._id === currentUser.userId ? "bg-blue-500 text-white" : "bg-white"}`}
              >
                {message.type === "image" ? (
                  <div>
                    <img
                      src={message.mediaUrl || "/placeholder.svg"}
                      alt="Shared image"
                      className="max-w-full h-auto rounded-lg mb-2"
                    />
                    {message.content !== "Image" && <p className="text-sm">{message.content}</p>}
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                <p
                  className={`text-xs mt-1 ${
                    message.sender._id === currentUser.userId ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </Card>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
