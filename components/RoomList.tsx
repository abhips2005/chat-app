import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Plus, Users, Clock } from "lucide-react"
import { getRooms, Room, getRoomMembers } from "@/lib/supabase"

interface RoomListProps {
  userId: string
}

export function RoomList({ userId }: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomMembers, setRoomMembers] = useState<{[key: string]: number}>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch rooms
  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoading(true)
        const roomsData = await getRooms()
        setRooms(roomsData)
        
        // Fetch member count for each room
        const memberCountPromises = roomsData.map(async (room) => {
          const members = await getRoomMembers(room.id)
          return { roomId: room.id, count: members.length }
        })
        
        const memberCounts = await Promise.all(memberCountPromises)
        const memberCountMap = memberCounts.reduce((acc, curr) => {
          acc[curr.roomId] = curr.count
          return acc
        }, {} as {[key: string]: number})
        
        setRoomMembers(memberCountMap)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching rooms:', error)
        setLoading(false)
      }
    }
    
    fetchRooms()
  }, [])

  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-md border border-white/10 p-4 shadow-xl">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Available Rooms
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/40 backdrop-blur-md border border-white/10 p-4 shadow-xl">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Available Rooms
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300"
          onClick={() => router.push("/rooms/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Room
        </Button>

        {rooms.length === 0 ? (
          <div className="text-center p-6 border border-white/10 rounded-lg">
            <p className="text-gray-400">No rooms available</p>
            <p className="text-sm text-gray-500 mt-1">Create your first room to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-3 border border-white/10 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-300 group relative overflow-hidden"
                onClick={() => router.push(`/rooms/${room.id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="font-medium text-white">{room.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center text-xs text-gray-400">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{roomMembers[room.id] || 0} members</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{new Date(room.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
