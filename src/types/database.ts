export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          total_xp: number
          level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_xp?: number
          level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_xp?: number
          level?: number
          updated_at?: string
        }
        Relationships: []
      }
      sidequests: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          location: string | null
          happened_at: string
          xp_earned: number
          ai_analysis: string | null
          ai_rating: number | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          location?: string | null
          happened_at: string
          xp_earned?: number
          ai_analysis?: string | null
          ai_rating?: number | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          location?: string | null
          happened_at?: string
          xp_earned?: number
          ai_analysis?: string | null
          ai_rating?: number | null
          is_published?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sidequests_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      sidequest_media: {
        Row: {
          id: string
          sidequest_id: string
          url: string
          storage_path: string
          media_type: 'photo' | 'video'
          ai_description: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          sidequest_id: string
          url: string
          storage_path: string
          media_type: 'photo' | 'video'
          ai_description?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          ai_description?: string | null
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: 'sidequest_media_sidequest_id_fkey'
            columns: ['sidequest_id']
            isOneToOne: false
            referencedRelation: 'sidequests'
            referencedColumns: ['id']
          }
        ]
      }
      friendships: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          addressee_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'rejected'
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          id: string
          user_id: string
          sidequest_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sidequest_id: string
          created_at?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          user_id: string
          sidequest_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sidequest_id: string
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
        Relationships: []
      }
      vouches: {
        Row: { id: string; user_id: string; sidequest_id: string; created_at: string }
        Insert: { id?: string; user_id: string; sidequest_id: string; created_at?: string }
        Update: { id?: string }
        Relationships: []
      }
      sidequest_collabs: {
        Row: {
          id: string
          sidequest_id: string
          invited_user_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
        }
        Insert: {
          id?: string
          sidequest_id: string
          invited_user_id: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'declined'
        }
        Relationships: []
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          xp_bonus: number
          category: string
        }
        Insert: {
          id: string
          name: string
          description: string
          icon: string
          xp_bonus?: number
          category?: string
        }
        Update: {
          name?: string
          description?: string
          icon?: string
          xp_bonus?: number
          category?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          earned_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_xp: {
        Args: { p_user_id: string; p_xp_delta: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type SidequestCollab = Database['public']['Tables']['sidequest_collabs']['Row']
export type Achievement = Database['public']['Tables']['achievements']['Row']
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Sidequest = Database['public']['Tables']['sidequests']['Row']
export type SidequestMedia = Database['public']['Tables']['sidequest_media']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']

export type Vouch = Database['public']['Tables']['vouches']['Row']

export type SidequestWithProfile = Sidequest & {
  profiles: Profile
  sidequest_media: SidequestMedia[]
  likes: Like[]
  comments: Comment[]
  vouches: Vouch[]
  likes_count: number
  comments_count: number
  vouches_count: number
  user_has_liked: boolean
  user_has_vouched: boolean
  is_verified: boolean
}
