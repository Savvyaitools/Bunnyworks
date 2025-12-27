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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      calendar_events: {
        Row: {
          all_day: boolean | null
          created_at: string
          creator_id: string | null
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      chatter_shifts: {
        Row: {
          chatter_id: string
          created_at: string
          creator_id: string
          id: string
          notes: string | null
          shift_end: string
          shift_start: string
          shift_type: string | null
        }
        Insert: {
          chatter_id: string
          created_at?: string
          creator_id: string
          id?: string
          notes?: string | null
          shift_end: string
          shift_start: string
          shift_type?: string | null
        }
        Update: {
          chatter_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          notes?: string | null
          shift_end?: string
          shift_start?: string
          shift_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatter_shifts_chatter_id_fkey"
            columns: ["chatter_id"]
            isOneToOne: false
            referencedRelation: "chatters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatter_shifts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      chatters: {
        Row: {
          auth_user_id: string | null
          avatar_seed: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          skill_grade: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_seed?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          skill_grade?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_seed?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          skill_grade?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_files: {
        Row: {
          created_at: string
          creator_id: string | null
          file_path: string
          file_size: number
          file_type: string
          folder_id: string | null
          id: string
          name: string
          status: string
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          file_path: string
          file_size: number
          file_type: string
          folder_id?: string | null
          id?: string
          name: string
          status?: string
          uploaded_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          folder_id?: string | null
          id?: string
          name?: string
          status?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_files_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      content_folders: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_folders_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      content_plans: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          platform: string | null
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          platform?: string | null
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          platform?: string | null
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_plans_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_assignments: {
        Row: {
          chatter_id: string
          created_at: string
          creator_id: string
          id: string
          role: string | null
        }
        Insert: {
          chatter_id: string
          created_at?: string
          creator_id: string
          id?: string
          role?: string | null
        }
        Update: {
          chatter_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_assignments_chatter_id_fkey"
            columns: ["chatter_id"]
            isOneToOne: false
            referencedRelation: "chatters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_assignments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_earnings: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          platform: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          creator_id: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          platform?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          platform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          alias: string | null
          avatar_seed: string | null
          created_at: string
          email: string
          followers: string | null
          id: string
          instagram_url: string | null
          manager_id: string | null
          name: string
          notes: string | null
          online_status: boolean | null
          onlyfans_url: string | null
          phone: string | null
          platform: string | null
          revenue: number
          snapchat_url: string | null
          status: string
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          alias?: string | null
          avatar_seed?: string | null
          created_at?: string
          email: string
          followers?: string | null
          id?: string
          instagram_url?: string | null
          manager_id?: string | null
          name: string
          notes?: string | null
          online_status?: boolean | null
          onlyfans_url?: string | null
          phone?: string | null
          platform?: string | null
          revenue?: number
          snapchat_url?: string | null
          status?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string | null
          avatar_seed?: string | null
          created_at?: string
          email?: string
          followers?: string | null
          id?: string
          instagram_url?: string | null
          manager_id?: string | null
          name?: string
          notes?: string | null
          online_status?: boolean | null
          onlyfans_url?: string | null
          phone?: string | null
          platform?: string | null
          revenue?: number
          snapchat_url?: string | null
          status?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creators_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          assigned_creators: number
          avatar_seed: string | null
          created_at: string
          department: string | null
          email: string
          hire_date: string | null
          id: string
          name: string
          phone: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_creators?: number
          avatar_seed?: string | null
          created_at?: string
          department?: string | null
          email: string
          hire_date?: string | null
          id?: string
          name: string
          phone?: string | null
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_creators?: number
          avatar_seed?: string | null
          created_at?: string
          department?: string | null
          email?: string
          hire_date?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      internal_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          recipient_id: string
          recipient_type: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient_id: string
          recipient_type: string
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient_id?: string
          recipient_type?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          creator_id: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          creator_id?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_accounts: {
        Row: {
          created_at: string
          creator_id: string
          followers_count: number | null
          id: string
          is_connected: boolean | null
          last_synced_at: string | null
          platform: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          followers_count?: number | null
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          platform: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          followers_count?: number | null
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          platform?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_accounts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_name: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_name: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_name?: string
          sender_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_type: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
          user_type: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_type?: string
        }
        Relationships: []
      }
      recruiting_creators: {
        Row: {
          alias: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          onboarded: boolean | null
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          alias?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          onboarded?: boolean | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          alias?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          onboarded?: boolean | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sop_documents: {
        Row: {
          category: string
          content: string | null
          created_at: string
          file_path: string | null
          file_type: string | null
          id: string
          roles: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          roles?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          roles?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          chatter_id: string | null
          created_at: string
          creator_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          chatter_id?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          chatter_id?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_chatter_id_fkey"
            columns: ["chatter_id"]
            isOneToOne: false
            referencedRelation: "chatters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      onboard_recruiting_creator: {
        Args: { recruiting_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "user"],
    },
  },
} as const
