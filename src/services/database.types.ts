export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      flashcard_sets: {
        Row: {
          cards: Json
          created_at: string
          id: string
          session_id: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          cards?: Json
          created_at?: string
          id?: string
          session_id?: string | null
          title?: string | null
          user_id?: string
        }
        Update: {
          cards?: Json
          created_at?: string
          id?: string
          session_id?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          course: string | null
          created_at: string
          guide: string | null
          id: string
          predictions: Json
          summary: string | null
          title: string | null
          topics_covered: string[]
          user_id: string
        }
        Insert: {
          course?: string | null
          created_at?: string
          guide?: string | null
          id?: string
          predictions?: Json
          summary?: string | null
          title?: string | null
          topics_covered?: string[]
          user_id?: string
        }
        Update: {
          course?: string | null
          created_at?: string
          guide?: string | null
          id?: string
          predictions?: Json
          summary?: string | null
          title?: string | null
          topics_covered?: string[]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
