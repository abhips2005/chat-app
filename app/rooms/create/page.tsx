"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { ArrowLeft, Sparkles } from "lucide-react"
import { createRoom } from "@/lib/supabase"

export default function CreateRoom() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        setAuthLoading(false)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setLoading(true)
      setError("")

      // Create room in Supabase
      const roomData = {
        name,
        description,
        created_by: user.uid,
      }

      const newRoom = await createRoom(roomData)
      router.push(`/rooms/${newRoom.id}`)
    } catch (error: any) {
      setError(error.message || "Failed to create room. Please try again.")
      setLoading(false)
    }
  }

  if (authLoading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <div className="container max-w-2xl px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 text-gray-300 hover:text-white hover:bg-white/10"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rooms
        </Button>

        <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50"></div>

          <CardHeader className="relative">
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Create a New Chat Room
            </CardTitle>
            <CardDescription className="text-gray-300">
              Design your virtual space for real-time conversations
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleCreateRoom}>
            <CardContent className="space-y-4 relative">
              {error && (
                <div className="p-3 text-sm bg-red-500/20 border border-red-500/50 text-red-300 rounded-md backdrop-blur-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Room Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Tech Discussion"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this room about?"
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>
            </CardContent>

            <CardFooter className="relative">
              <Button
                type="submit"
                className="w-full relative overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300"
                disabled={loading}
              >
                <div className="absolute inset-0 w-0 bg-white/20 group-hover:w-full transition-all duration-500"></div>
                <div className="flex items-center justify-center gap-2 relative z-10">
                  <Sparkles className="h-4 w-4" />
                  <span>{loading ? "Creating..." : "Create Room"}</span>
                </div>
              </Button>
            </CardFooter>
          </form>
        </Card>
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

