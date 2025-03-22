import { supabase } from './firebase'
import { User } from 'firebase/auth'

// Type definitions
export interface Room {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

// Room functions
export const createRoom = async (roomData: { name: string; description?: string; created_by: string }) => {
  const { data, error } = await supabase
    .from('rooms')
    .insert([roomData])
    .select()
  
  if (error) throw error
  return data[0] as Room
}

export const joinRoom = async (roomId: string, userId: string) => {
  // First check if user is already a member to avoid duplicate errors
  const existingMember = await isUserRoomMember(roomId, userId)
  if (existingMember) return null

  const { data, error } = await supabase
    .from('room_members')
    .insert([{ room_id: roomId, user_id: userId }])
    .select()
  
  if (error) throw error
  return data[0] as RoomMember
}

export const getRooms = async () => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Room[]
}

export const getRoomById = async (roomId: string) => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()
  
  if (error) throw error
  return data as Room
}

export const getRoomMembers = async (roomId: string) => {
  const { data, error } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)
  
  if (error) throw error
  return data as RoomMember[]
}

export const isUserRoomMember = async (roomId: string, userId: string) => {
  const { data, error } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .single()
  
  if (error && error.code === 'PGRST116') {
    return false
  } else if (error) {
    console.error('Error checking room membership:', error)
    return false
  }
  return true
}

export const getRoomMessages = async (roomId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data as Message[]
}

export const sendMessage = async (messageData: { 
  room_id: string; 
  user_id: string; 
  user_name: string; 
  user_avatar?: string; 
  content: string 
}) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([messageData])
    .select()
  
  if (error) throw error
  return data[0] as Message
}

export const subscribeToRoomMessages = (roomId: string, callback: (messages: Message[]) => void) => {
  return supabase
    .channel(`room-${roomId}-messages`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${roomId}`
    }, async (payload) => {
      // When a message changes, fetch all messages again
      const messages = await getRoomMessages(roomId)
      callback(messages)
    })
    .subscribe()
}

export const subscribeToRooms = (callback: (rooms: Room[]) => void) => {
  return supabase
    .channel('rooms')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'rooms',
    }, async () => {
      // When rooms change, fetch all rooms again
      const rooms = await getRooms()
      callback(rooms)
    })
    .subscribe()
}

// Get user's rooms
export const getUserRooms = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_user_rooms', { user_id: userId })
  
  if (error) throw error
  return data as Room[]
}

// Leave room
export const leaveRoom = async (roomId: string, userId: string) => {
  const { error } = await supabase
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId)
  
  if (error) throw error
  return true
}
