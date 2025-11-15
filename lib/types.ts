export type Athlete = {
  id: string; sport: string; position?: string | null; level?: string | null; age?: number | null; currentClub?: string | null; contract?: string | null;
  profileId: string; profile: { id: string; displayName: string }
};
export type AthleteWithProfile = Athlete;

export type Message = {
  id: number | string
  senderId: string
  receiverId: string
  text: string
  timestamp: string
  read: boolean
}

export type ConversationSummary = {
  peerId: string
  lastMessage: Message
  unread: number
}
