"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ChatSidebar from "@/components/chat/chat-sidebar"
import ChatWindow from "@/components/chat/chat-window"

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      } else {
        router.push("/")
      }
    } catch (error) {
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="h-screen flex">
      <ChatSidebar
        currentUser={currentUser}
        selectedChat={selectedChat}
        onChatSelect={setSelectedChat}
        onLogout={handleLogout}
      />
      <ChatWindow chatId={selectedChat || ""} currentUser={currentUser} />
    </div>
  )
}
