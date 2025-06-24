"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Search, Plus, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Chat {
  _id: string
  participants: any[]
  participantDetails: any[]
  isGroup: boolean
  name?: string
  lastMessage?: any[]
  updatedAt: string
}

interface User {
  _id: string
  username: string
  email: string
  avatar: string
}

interface ChatSidebarProps {
  currentUser: any
  selectedChat: string | null
  onChatSelect: (chatId: string) => void
  onLogout: () => void
}

export default function ChatSidebar({ currentUser, selectedChat, onChatSelect, onLogout }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats")
      if (response.ok) {
        const data = await response.json()
        setChats(data.chats)
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users)
      }
    } catch (error) {
      console.error("Search failed:", error)
    }
  }

  const startChat = async (userId: string) => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: userId }),
      })

      if (response.ok) {
        const data = await response.json()
        onChatSelect(data.chatId)
        setIsSearchOpen(false)
        setSearchQuery("")
        setSearchResults([])
        fetchChats()
      }
    } catch (error) {
      console.error("Failed to start chat:", error)
    }
  }

  const getChatName = (chat: Chat) => {
    if (chat.isGroup) {
      return chat.name || "Group Chat"
    }
    const otherParticipant = chat.participantDetails.find((p) => p._id.toString() !== currentUser.userId)
    return otherParticipant?.username || "Unknown User"
  }

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) {
      return "/placeholder.svg?height=40&width=40"
    }
    const otherParticipant = chat.participantDetails.find((p) => p._id.toString() !== currentUser.userId)
    return otherParticipant?.avatar || "/placeholder.svg?height=40&width=40"
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={currentUser.avatar || "/placeholder.svg"} />
              <AvatarFallback>{currentUser.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{currentUser.username}</h2>
              <p className="text-sm text-gray-500">{currentUser.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>

        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Chat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email or username..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchUsers(e.target.value)
                  }}
                  className="pl-10"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((user) => (
                  <Card
                    key={user._id}
                    className="p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => startChat(user._id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat._id}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
              selectedChat === chat._id ? "bg-blue-50 border-blue-200" : ""
            }`}
            onClick={() => onChatSelect(chat._id)}
          >
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={getChatAvatar(chat) || "/placeholder.svg"} />
                <AvatarFallback>
                  {chat.isGroup ? <Users className="w-4 h-4" /> : getChatName(chat)[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{getChatName(chat)}</p>
                  <span className="text-xs text-gray-500">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                </div>
                {chat.lastMessage && chat.lastMessage[0] && (
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage[0].type === "image" ? "📷 Image" : chat.lastMessage[0].content}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
