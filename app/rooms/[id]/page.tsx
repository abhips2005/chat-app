"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { ArrowLeft, Send, Users, Info, Sparkles } from "lucide-react"
import { 
  getRoomById, 
  isUserRoomMember, 
  joinRoom, 
  getRoomMessages, 
  sendMessage, 
  subscribeToRoomMessages,
  getRoomMembers,
  Message,
  Room,
  RoomMember
} from "@/lib/supabase"

export default function ChatRoom({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<RoomMember[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showMembers, setShowMembers] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Fetch room data
  useEffect(() => {
    if (!user) return

    const fetchRoom = async () => {
      try {
        setLoading(true)
        
        // Get room data from Supabase
        const roomData = await getRoomById(params.id)
        setRoom(roomData)
        
        // Get room members
        const roomMembers = await getRoomMembers(params.id)
        setMembers(roomMembers)
        
        // Check if user is a member
        const isMember = await isUserRoomMember(params.id, user.uid)
        
        // Add user to room members if not already a member
        if (!isMember) {
          await joinRoom(params.id, user.uid)
          // Update members after joining
          const updatedMembers = await getRoomMembers(params.id)
          setMembers(updatedMembers)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching room:", error)
        setError("Failed to load room data")
        setLoading(false)
      }
    }

    fetchRoom()
  }, [params.id, user])

  // Subscribe to messages
  useEffect(() => {
    if (!user || !room) return
    
    // Fetch initial messages
    getRoomMessages(params.id).then(setMessages)
    
    // Subscribe to new messages
    const subscription = subscribeToRoomMessages(params.id, setMessages)
    
    return () => {
      subscription.unsubscribe()
    }
  }, [params.id, room, user])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !user || !room) return
    
    try {
      await sendMessage({
        room_id: params.id,
        user_id: user.uid,
        user_name: user.displayName || user.email || "Anonymous",
        user_avatar: user.photoURL || undefined,
        content: newMessage
      })
      
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-purple-500 animate-spin animation-delay-150"></div>
          <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-pink-500 animate-spin animation-delay-300"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="container px-4 py-8">
          <div className="text-center p-8 border border-white/10 rounded-lg bg-black/40 backdrop-blur-md">
            <p className="text-red-400 mb-4">{error}</p>
            <Button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
            >
              Back to Rooms
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!room) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col">
      <header className="border-b border-white/10 backdrop-blur-md bg-black/30 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                {room.name}
              </h1>
              {room.description && <p className="text-xs text-gray-400 hidden md:block">{room.description}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                    onClick={() => setShowMembers(!showMembers)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Room Information</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              <span>{members.length}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden container px-4 py-4 flex flex-col">
        {showMembers && (
          <div className="mb-4 p-4 border border-white/10 rounded-lg bg-black/40 backdrop-blur-md">
            <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Room Information
            </h3>
            <p className="text-sm text-gray-300 mt-1">{room.description || "No description provided"}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
              <span>Created by:</span>
              <span className="text-white">{room.created_by}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
              <span>Members:</span>
              <span className="text-white">{members.length}</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden border border-white/10 rounded-lg bg-black/40 backdrop-blur-md relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>

          <ScrollArea className="h-full relative z-10 p-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 inline-block mb-4">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-gray-300 mb-2">No messages yet</p>
                  <p className="text-sm text-gray-400">Be the first to send a message!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.user_id === user?.uid ? "justify-end" : "justify-start"}`}
                  >
                    {message.user_id !== user?.uid && (
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={message.user_avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                          {message.user_name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.user_id === user?.uid
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "bg-white/10 border border-white/5"
                      }`}
                    >
                      {message.user_id !== user?.uid && (
                        <div className="text-xs font-medium mb-1 text-blue-300">{message.user_name}</div>
                      )}
                      <div>{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {message.user_id === user?.uid && (
                      <Avatar className="h-8 w-8 ml-2">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                          {user.displayName?.charAt(0).toUpperCase() || 
                           user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="pt-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-black/40 backdrop-blur-md border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  )
}

