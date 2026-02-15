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
      active_browser_sessions: {
        Row: {
          agency_id: string
          browserbase_live_url: string | null
          browserbase_session_id: string
          chatter_id: string | null
          created_at: string | null
          embed_url: string
          ended_at: string | null
          has_recording: boolean | null
          id: string
          is_active: boolean | null
          recording_url: string | null
          session_link_id: string | null
          session_type: string | null
          started_at: string | null
        }
        Insert: {
          agency_id: string
          browserbase_live_url?: string | null
          browserbase_session_id: string
          chatter_id?: string | null
          created_at?: string | null
          embed_url: string
          ended_at?: string | null
          has_recording?: boolean | null
          id?: string
          is_active?: boolean | null
          recording_url?: string | null
          session_link_id?: string | null
          session_type?: string | null
          started_at?: string | null
        }
        Update: {
          agency_id?: string
          browserbase_live_url?: string | null
          browserbase_session_id?: string
          chatter_id?: string | null
          created_at?: string | null
          embed_url?: string
          ended_at?: string | null
          has_recording?: boolean | null
          id?: string
          is_active?: boolean | null
          recording_url?: string | null
          session_link_id?: string | null
          session_type?: string | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "active_browser_sessions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_browser_sessions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_browser_sessions_chatter_id_fkey"
            columns: ["chatter_id"]
            isOneToOne: false
            referencedRelation: "chatters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_browser_sessions_session_link_id_fkey"
            columns: ["session_link_id"]
            isOneToOne: false
            referencedRelation: "creator_session_links"
            referencedColumns: ["id"]
          },
        ]
      }
      agencies: {
        Row: {
          browser_sync_enabled: boolean | null
          commission_rate: number
          created_at: string
          id: string
          logo_url: string | null
          max_creators: number
          max_employees: number
          name: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          subscription_tier: string
          updated_at: string
          website: string | null
        }
        Insert: {
          browser_sync_enabled?: boolean | null
          commission_rate?: number
          created_at?: string
          id?: string
          logo_url?: string | null
          max_creators?: number
          max_employees?: number
          name: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          browser_sync_enabled?: boolean | null
          commission_rate?: number
          created_at?: string
          id?: string
          logo_url?: string | null
          max_creators?: number
          max_employees?: number
          name?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      agent_actions: {
        Row: {
          action_type: string
          agency_id: string
          created_at: string
          id: string
          outcome: string | null
          outcome_details: string | null
          parameters: Json | null
          run_id: string
          target_entity_id: string | null
          target_entity_type: string | null
          was_overridden: boolean | null
        }
        Insert: {
          action_type: string
          agency_id: string
          created_at?: string
          id?: string
          outcome?: string | null
          outcome_details?: string | null
          parameters?: Json | null
          run_id: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          was_overridden?: boolean | null
        }
        Update: {
          action_type?: string
          agency_id?: string
          created_at?: string
          id?: string
          outcome?: string | null
          outcome_details?: string | null
          parameters?: Json | null
          run_id?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          was_overridden?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_feedback: {
        Row: {
          action_id: string
          agency_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          action_id: string
          agency_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
        }
        Update: {
          action_id?: string
          agency_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_feedback_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "agent_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_feedback_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_feedback_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_goals: {
        Row: {
          agency_id: string
          created_at: string
          current_value: number
          id: string
          is_active: boolean
          metric: string
          priority: string
          target_value: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          current_value?: number
          id?: string
          is_active?: boolean
          metric: string
          priority?: string
          target_value: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          current_value?: number
          id?: string
          is_active?: boolean
          metric?: string
          priority?: string
          target_value?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_goals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_goals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          actions_taken: number
          agency_id: string
          agent_type: string
          completed_at: string | null
          created_at: string
          data_snapshot: Json | null
          duration_ms: number | null
          error_message: string | null
          id: string
          status: string
        }
        Insert: {
          actions_taken?: number
          agency_id: string
          agent_type: string
          completed_at?: string | null
          created_at?: string
          data_snapshot?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          status?: string
        }
        Update: {
          actions_taken?: number
          agency_id?: string
          agent_type?: string
          completed_at?: string | null
          created_at?: string
          data_snapshot?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_fan_context: {
        Row: {
          avg_ppv_price: number | null
          conversation_notes: string | null
          created_at: string
          engagement_level: string | null
          id: string
          interests: string[] | null
          last_purchase_at: string | null
          max_ppv_purchased: number | null
          of_account_id: string
          of_fan_id: string
          preferred_content_types: string[] | null
          purchase_frequency: string | null
          spending_tier: string | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          avg_ppv_price?: number | null
          conversation_notes?: string | null
          created_at?: string
          engagement_level?: string | null
          id?: string
          interests?: string[] | null
          last_purchase_at?: string | null
          max_ppv_purchased?: number | null
          of_account_id: string
          of_fan_id: string
          preferred_content_types?: string[] | null
          purchase_frequency?: string | null
          spending_tier?: string | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          avg_ppv_price?: number | null
          conversation_notes?: string | null
          created_at?: string
          engagement_level?: string | null
          id?: string
          interests?: string[] | null
          last_purchase_at?: string | null
          max_ppv_purchased?: number | null
          of_account_id?: string
          of_fan_id?: string
          preferred_content_types?: string[] | null
          purchase_frequency?: string | null
          spending_tier?: string | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          examples: Json | null
          id: string
          priority: number | null
          subcategory: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          examples?: Json | null
          id?: string
          priority?: number | null
          subcategory?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          examples?: Json | null
          id?: string
          priority?: number | null
          subcategory?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_performance_alerts: {
        Row: {
          agency_id: string
          alert_type: string
          created_at: string
          data: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          severity: string | null
          title: string
        }
        Insert: {
          agency_id: string
          alert_type: string
          created_at?: string
          data?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          severity?: string | null
          title: string
        }
        Update: {
          agency_id?: string
          alert_type?: string
          created_at?: string
          data?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          severity?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_performance_alerts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_performance_alerts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions_log: {
        Row: {
          agency_id: string | null
          created_at: string
          creator_id: string | null
          employee_id: string | null
          final_message: string | null
          id: string
          of_chat_id: string | null
          resulted_in_sale: boolean | null
          sale_amount: number | null
          selected_index: number | null
          suggestion_type: string
          suggestions: Json
          was_edited: boolean | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          creator_id?: string | null
          employee_id?: string | null
          final_message?: string | null
          id?: string
          of_chat_id?: string | null
          resulted_in_sale?: boolean | null
          sale_amount?: number | null
          selected_index?: number | null
          suggestion_type: string
          suggestions: Json
          was_edited?: boolean | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          creator_id?: string | null
          employee_id?: string | null
          final_message?: string | null
          id?: string
          of_chat_id?: string | null
          resulted_in_sale?: boolean | null
          sale_amount?: number | null
          selected_index?: number | null
          suggestion_type?: string
          suggestions?: Json
          was_edited?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_log_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_log_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      browser_extensions: {
        Row: {
          agency_id: string
          auto_inject: boolean | null
          browserbase_extension_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          auto_inject?: boolean | null
          browserbase_extension_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          auto_inject?: boolean | null
          browserbase_extension_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "browser_extensions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "browser_extensions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      browser_session_events: {
        Row: {
          active_session_id: string | null
          agency_id: string
          browserbase_session_id: string
          created_at: string | null
          event_type: string
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          session_link_id: string | null
          severity: string | null
          title: string
        }
        Insert: {
          active_session_id?: string | null
          agency_id: string
          browserbase_session_id: string
          created_at?: string | null
          event_type: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          session_link_id?: string | null
          severity?: string | null
          title: string
        }
        Update: {
          active_session_id?: string | null
          agency_id?: string
          browserbase_session_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          session_link_id?: string | null
          severity?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "browser_session_events_active_session_id_fkey"
            columns: ["active_session_id"]
            isOneToOne: false
            referencedRelation: "active_browser_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "browser_session_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "browser_session_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "browser_session_events_session_link_id_fkey"
            columns: ["session_link_id"]
            isOneToOne: false
            referencedRelation: "creator_session_links"
            referencedColumns: ["id"]
          },
        ]
      }
      browser_sync_tokens: {
        Row: {
          agency_id: string
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "browser_sync_tokens_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "browser_sync_tokens_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          agency_id: string | null
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
          agency_id?: string | null
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
          agency_id?: string | null
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
            foreignKeyName: "calendar_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
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
          employee_id: string | null
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
          employee_id?: string | null
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
          employee_id?: string | null
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
          {
            foreignKeyName: "chatter_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      chatter_time_logs: {
        Row: {
          chatter_id: string
          clock_in: string
          clock_out: string | null
          created_at: string
          duration_minutes: number | null
          employee_id: string | null
          id: string
          notes: string | null
          shift_id: string | null
        }
        Insert: {
          chatter_id: string
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          duration_minutes?: number | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          shift_id?: string | null
        }
        Update: {
          chatter_id?: string
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          duration_minutes?: number | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          shift_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatter_time_logs_chatter_id_fkey"
            columns: ["chatter_id"]
            isOneToOne: false
            referencedRelation: "chatters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatter_time_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatter_time_logs_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "chatter_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      chatters: {
        Row: {
          agency_id: string | null
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
          agency_id?: string | null
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
          agency_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "chatters_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatters_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_pbf_conversations: {
        Row: {
          agency_id: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_pbf_conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_pbf_conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_pbf_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          data_accessed: Json | null
          id: string
          query_type: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          data_accessed?: Json | null
          id?: string
          query_type?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          data_accessed?: Json | null
          id?: string
          query_type?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_pbf_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coach_pbf_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_files: {
        Row: {
          agency_id: string | null
          content_type: string | null
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
          agency_id?: string | null
          content_type?: string | null
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
          agency_id?: string | null
          content_type?: string | null
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
            foreignKeyName: "content_files_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_files_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
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
          agency_id: string | null
          created_at: string
          creator_id: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          creator_id: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_folders_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_folders_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
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
          agency_id: string | null
          board_column: string
          board_position: number
          content_category: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          platform: string | null
          reference_media: Json | null
          scheduled_date: string | null
          status: string
          submission_status: string | null
          submitted_at: string | null
          submitted_media: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          board_column?: string
          board_position?: number
          content_category?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          platform?: string | null
          reference_media?: Json | null
          scheduled_date?: string | null
          status?: string
          submission_status?: string | null
          submitted_at?: string | null
          submitted_media?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          board_column?: string
          board_position?: number
          content_category?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          platform?: string | null
          reference_media?: Json | null
          scheduled_date?: string | null
          status?: string
          submission_status?: string | null
          submitted_at?: string | null
          submitted_media?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_plans_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_plans_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
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
          employee_id: string | null
          id: string
          role: string | null
        }
        Insert: {
          chatter_id: string
          created_at?: string
          creator_id: string
          employee_id?: string | null
          id?: string
          role?: string | null
        }
        Update: {
          chatter_id?: string
          created_at?: string
          creator_id?: string
          employee_id?: string | null
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
          {
            foreignKeyName: "creator_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_credential_submissions: {
        Row: {
          agency_id: string
          created_at: string
          creator_id: string
          encrypted_password: string
          id: string
          notes: string | null
          platform: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          username: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          creator_id: string
          encrypted_password: string
          id?: string
          notes?: string | null
          platform?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          username: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          creator_id?: string
          encrypted_password?: string
          id?: string
          notes?: string | null
          platform?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_credential_submissions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_credential_submissions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_credential_submissions_creator_id_fkey"
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
          import_id: string | null
          messages_revenue: number | null
          notes: string | null
          period_end: string
          period_start: string
          platform: string | null
          referrals: number | null
          subscriptions: number | null
          tips: number | null
        }
        Insert: {
          amount?: number
          created_at?: string
          creator_id: string
          id?: string
          import_id?: string | null
          messages_revenue?: number | null
          notes?: string | null
          period_end: string
          period_start: string
          platform?: string | null
          referrals?: number | null
          subscriptions?: number | null
          tips?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          id?: string
          import_id?: string | null
          messages_revenue?: number | null
          notes?: string | null
          period_end?: string
          period_start?: string
          platform?: string | null
          referrals?: number | null
          subscriptions?: number | null
          tips?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_earnings_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "data_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_session_links: {
        Row: {
          agency_id: string
          browserbase_context_id: string | null
          browserbase_live_url: string | null
          browserbase_session_id: string | null
          created_at: string
          created_by: string
          creator_id: string
          encrypted_session: string
          expires_at: string
          id: string
          is_active: boolean
          last_saved_at: string | null
          notes: string | null
          platform: string
          session_status: string | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          browserbase_context_id?: string | null
          browserbase_live_url?: string | null
          browserbase_session_id?: string | null
          created_at?: string
          created_by: string
          creator_id: string
          encrypted_session: string
          expires_at: string
          id?: string
          is_active?: boolean
          last_saved_at?: string | null
          notes?: string | null
          platform: string
          session_status?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          browserbase_context_id?: string | null
          browserbase_live_url?: string | null
          browserbase_session_id?: string | null
          created_at?: string
          created_by?: string
          creator_id?: string
          encrypted_session?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          last_saved_at?: string | null
          notes?: string | null
          platform?: string
          session_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_session_links_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_session_links_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_session_links_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_social_accounts: {
        Row: {
          account_type: string
          created_at: string
          creator_id: string
          id: string
          of_account_id: string | null
          of_connected_at: string | null
          of_connection_status: string | null
          of_last_error: string | null
          of_last_error_at: string | null
          of_last_synced_at: string | null
          of_next_retry_at: string | null
          of_sync_retry_count: number | null
          platform: string
          profile_url: string | null
          updated_at: string
          username: string
        }
        Insert: {
          account_type?: string
          created_at?: string
          creator_id: string
          id?: string
          of_account_id?: string | null
          of_connected_at?: string | null
          of_connection_status?: string | null
          of_last_error?: string | null
          of_last_error_at?: string | null
          of_last_synced_at?: string | null
          of_next_retry_at?: string | null
          of_sync_retry_count?: number | null
          platform: string
          profile_url?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          account_type?: string
          created_at?: string
          creator_id?: string
          id?: string
          of_account_id?: string | null
          of_connected_at?: string | null
          of_connection_status?: string | null
          of_last_error?: string | null
          of_last_error_at?: string | null
          of_last_synced_at?: string | null
          of_next_retry_at?: string | null
          of_sync_retry_count?: number | null
          platform?: string
          profile_url?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_social_accounts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_voice_profiles: {
        Row: {
          boundaries: Json | null
          created_at: string
          creator_id: string
          emoji_style: string | null
          greeting_style: string | null
          id: string
          personality_traits: string[] | null
          sample_messages: Json | null
          sign_off_style: string | null
          tone: string | null
          updated_at: string
          vocabulary: string[] | null
        }
        Insert: {
          boundaries?: Json | null
          created_at?: string
          creator_id: string
          emoji_style?: string | null
          greeting_style?: string | null
          id?: string
          personality_traits?: string[] | null
          sample_messages?: Json | null
          sign_off_style?: string | null
          tone?: string | null
          updated_at?: string
          vocabulary?: string[] | null
        }
        Update: {
          boundaries?: Json | null
          created_at?: string
          creator_id?: string
          emoji_style?: string | null
          greeting_style?: string | null
          id?: string
          personality_traits?: string[] | null
          sample_messages?: Json | null
          sign_off_style?: string | null
          tone?: string | null
          updated_at?: string
          vocabulary?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_voice_profiles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          agency_id: string | null
          alias: string | null
          allows_custom_requests: boolean | null
          allows_masturbation: boolean | null
          allows_toy_bjs: boolean | null
          allows_video_calls: boolean | null
          allows_writing_name: boolean | null
          attracted_to: string | null
          auth_user_id: string | null
          avatar_seed: string | null
          avatar_url: string | null
          body_type: string | null
          boundaries: string | null
          bra_size: string | null
          branding: Json | null
          character_traits: string[] | null
          commission_rate: number | null
          content_types: string[] | null
          created_at: string
          creator_references: string | null
          email: string
          eye_color: string | null
          favorite_food: string | null
          favorite_music: string | null
          favorite_position: string | null
          fetish_content: string[] | null
          followers: string | null
          hair_color: string | null
          height: string | null
          hobbies: string | null
          id: string
          instagram_url: string | null
          location: string | null
          manager_id: string | null
          name: string
          niche: string[] | null
          notes: string | null
          occupation: string | null
          of_livestreams: boolean | null
          online_status: boolean | null
          onlyfans_url: string | null
          persona: string | null
          phone: string | null
          platform: string | null
          proxy_country: string | null
          proxy_state: string | null
          revenue: number
          saying_sub_name: boolean | null
          snapchat_url: string | null
          status: string
          tiktok_url: string | null
          turn_ons: string | null
          twitter_url: string | null
          updated_at: string
          uses_toys: boolean | null
          weight: string | null
        }
        Insert: {
          agency_id?: string | null
          alias?: string | null
          allows_custom_requests?: boolean | null
          allows_masturbation?: boolean | null
          allows_toy_bjs?: boolean | null
          allows_video_calls?: boolean | null
          allows_writing_name?: boolean | null
          attracted_to?: string | null
          auth_user_id?: string | null
          avatar_seed?: string | null
          avatar_url?: string | null
          body_type?: string | null
          boundaries?: string | null
          bra_size?: string | null
          branding?: Json | null
          character_traits?: string[] | null
          commission_rate?: number | null
          content_types?: string[] | null
          created_at?: string
          creator_references?: string | null
          email: string
          eye_color?: string | null
          favorite_food?: string | null
          favorite_music?: string | null
          favorite_position?: string | null
          fetish_content?: string[] | null
          followers?: string | null
          hair_color?: string | null
          height?: string | null
          hobbies?: string | null
          id?: string
          instagram_url?: string | null
          location?: string | null
          manager_id?: string | null
          name: string
          niche?: string[] | null
          notes?: string | null
          occupation?: string | null
          of_livestreams?: boolean | null
          online_status?: boolean | null
          onlyfans_url?: string | null
          persona?: string | null
          phone?: string | null
          platform?: string | null
          proxy_country?: string | null
          proxy_state?: string | null
          revenue?: number
          saying_sub_name?: boolean | null
          snapchat_url?: string | null
          status?: string
          tiktok_url?: string | null
          turn_ons?: string | null
          twitter_url?: string | null
          updated_at?: string
          uses_toys?: boolean | null
          weight?: string | null
        }
        Update: {
          agency_id?: string | null
          alias?: string | null
          allows_custom_requests?: boolean | null
          allows_masturbation?: boolean | null
          allows_toy_bjs?: boolean | null
          allows_video_calls?: boolean | null
          allows_writing_name?: boolean | null
          attracted_to?: string | null
          auth_user_id?: string | null
          avatar_seed?: string | null
          avatar_url?: string | null
          body_type?: string | null
          boundaries?: string | null
          bra_size?: string | null
          branding?: Json | null
          character_traits?: string[] | null
          commission_rate?: number | null
          content_types?: string[] | null
          created_at?: string
          creator_references?: string | null
          email?: string
          eye_color?: string | null
          favorite_food?: string | null
          favorite_music?: string | null
          favorite_position?: string | null
          fetish_content?: string[] | null
          followers?: string | null
          hair_color?: string | null
          height?: string | null
          hobbies?: string | null
          id?: string
          instagram_url?: string | null
          location?: string | null
          manager_id?: string | null
          name?: string
          niche?: string[] | null
          notes?: string | null
          occupation?: string | null
          of_livestreams?: boolean | null
          online_status?: boolean | null
          onlyfans_url?: string | null
          persona?: string | null
          phone?: string | null
          platform?: string | null
          proxy_country?: string | null
          proxy_state?: string | null
          revenue?: number
          saying_sub_name?: boolean | null
          snapchat_url?: string | null
          status?: string
          tiktok_url?: string | null
          turn_ons?: string | null
          twitter_url?: string | null
          updated_at?: string
          uses_toys?: boolean | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creators_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creators_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_requests: {
        Row: {
          agency_id: string
          attachments: Json | null
          created_at: string
          creator_id: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          price: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          attachments?: Json | null
          created_at?: string
          creator_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          attachments?: Json | null
          created_at?: string
          creator_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_requests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      data_imports: {
        Row: {
          agency_id: string | null
          confidence_score: number | null
          created_at: string
          creator_id: string | null
          file_name: string
          file_path: string
          id: string
          raw_payload: Json | null
          rejection_reason: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          confidence_score?: number | null
          created_at?: string
          creator_id?: string | null
          file_name: string
          file_path: string
          id?: string
          raw_payload?: Json | null
          rejection_reason?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          confidence_score?: number | null
          created_at?: string
          creator_id?: string | null
          file_name?: string
          file_path?: string
          id?: string
          raw_payload?: Json | null
          rejection_reason?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_imports_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_imports_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_imports_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_bonus_awards: {
        Row: {
          bonus_amount: number
          bonus_structure_id: string
          created_at: string
          employee_id: string
          grade_earned: string
          id: string
          metrics_snapshot: Json | null
          performance_score: number
        }
        Insert: {
          bonus_amount: number
          bonus_structure_id: string
          created_at?: string
          employee_id: string
          grade_earned: string
          id?: string
          metrics_snapshot?: Json | null
          performance_score: number
        }
        Update: {
          bonus_amount?: number
          bonus_structure_id?: string
          created_at?: string
          employee_id?: string
          grade_earned?: string
          id?: string
          metrics_snapshot?: Json | null
          performance_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_bonus_awards_bonus_structure_id_fkey"
            columns: ["bonus_structure_id"]
            isOneToOne: false
            referencedRelation: "employee_bonus_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_bonus_awards_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_bonus_structures: {
        Row: {
          agency_id: string
          created_at: string
          department: string
          grade_a_bonus: number
          grade_a_threshold: number
          grade_b_bonus: number
          grade_b_threshold: number
          grade_c_bonus: number
          grade_c_threshold: number
          id: string
          name: string
          period_month: number
          period_year: number
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          department: string
          grade_a_bonus?: number
          grade_a_threshold?: number
          grade_b_bonus?: number
          grade_b_threshold?: number
          grade_c_bonus?: number
          grade_c_threshold?: number
          id?: string
          name: string
          period_month: number
          period_year: number
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          department?: string
          grade_a_bonus?: number
          grade_a_threshold?: number
          grade_b_bonus?: number
          grade_b_threshold?: number
          grade_c_bonus?: number
          grade_c_threshold?: number
          id?: string
          name?: string
          period_month?: number
          period_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_bonus_structures_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_bonus_structures_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_kpis: {
        Row: {
          avg_response_time_minutes: number | null
          created_at: string
          creators_managed: number
          employee_id: string
          id: string
          messages_sent: number
          notes: string | null
          period_end: string
          period_start: string
          rating: number | null
          revenue_generated: number
          tasks_assigned: number
          tasks_completed: number
          updated_at: string
        }
        Insert: {
          avg_response_time_minutes?: number | null
          created_at?: string
          creators_managed?: number
          employee_id: string
          id?: string
          messages_sent?: number
          notes?: string | null
          period_end: string
          period_start: string
          rating?: number | null
          revenue_generated?: number
          tasks_assigned?: number
          tasks_completed?: number
          updated_at?: string
        }
        Update: {
          avg_response_time_minutes?: number | null
          created_at?: string
          creators_managed?: number
          employee_id?: string
          id?: string
          messages_sent?: number
          notes?: string | null
          period_end?: string
          period_start?: string
          rating?: number | null
          revenue_generated?: number
          tasks_assigned?: number
          tasks_completed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_kpis_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_of_activity_logs: {
        Row: {
          action: string
          agency_id: string
          created_at: string | null
          creator_id: string | null
          details: Json | null
          employee_id: string | null
          id: string
          ip_address: string | null
          of_account_id: string
        }
        Insert: {
          action: string
          agency_id: string
          created_at?: string | null
          creator_id?: string | null
          details?: Json | null
          employee_id?: string | null
          id?: string
          ip_address?: string | null
          of_account_id: string
        }
        Update: {
          action?: string
          agency_id?: string
          created_at?: string | null
          creator_id?: string | null
          details?: Json | null
          employee_id?: string | null
          id?: string
          ip_address?: string | null
          of_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_of_activity_logs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_of_activity_logs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_of_activity_logs_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_of_activity_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_of_permissions: {
        Row: {
          agency_id: string
          can_create_posts: boolean | null
          can_send_mass_messages: boolean | null
          can_send_messages: boolean | null
          can_view_chats: boolean | null
          can_view_earnings: boolean | null
          can_view_fans: boolean | null
          can_view_notifications: boolean | null
          can_view_posts: boolean | null
          can_view_vault: boolean | null
          created_at: string | null
          creator_id: string
          employee_id: string
          granted_by: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          can_create_posts?: boolean | null
          can_send_mass_messages?: boolean | null
          can_send_messages?: boolean | null
          can_view_chats?: boolean | null
          can_view_earnings?: boolean | null
          can_view_fans?: boolean | null
          can_view_notifications?: boolean | null
          can_view_posts?: boolean | null
          can_view_vault?: boolean | null
          created_at?: string | null
          creator_id: string
          employee_id: string
          granted_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          can_create_posts?: boolean | null
          can_send_mass_messages?: boolean | null
          can_send_messages?: boolean | null
          can_view_chats?: boolean | null
          can_view_earnings?: boolean | null
          can_view_fans?: boolean | null
          can_view_notifications?: boolean | null
          can_view_posts?: boolean | null
          can_view_vault?: boolean | null
          created_at?: string | null
          creator_id?: string
          employee_id?: string
          granted_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_of_permissions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_of_permissions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_of_permissions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_of_permissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_payroll: {
        Row: {
          base_salary: number
          bonus: number
          commission_earned: number
          created_at: string
          deductions: number
          employee_id: string
          id: string
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          total_payout: number
          updated_at: string
        }
        Insert: {
          base_salary?: number
          bonus?: number
          commission_earned?: number
          created_at?: string
          deductions?: number
          employee_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          total_payout?: number
          updated_at?: string
        }
        Update: {
          base_salary?: number
          bonus?: number
          commission_earned?: number
          created_at?: string
          deductions?: number
          employee_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_payout?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          agency_id: string | null
          assigned_creators: number
          auth_user_id: string | null
          avatar_seed: string | null
          bio: string | null
          certifications: string[] | null
          commission_rate: number | null
          created_at: string
          daily_target_messages: number | null
          daily_target_ppv: number | null
          department: string | null
          education: string | null
          email: string
          emergency_contact: string | null
          experience: string | null
          hire_date: string | null
          id: string
          is_chatter: boolean | null
          name: string
          phone: string | null
          role: string
          salary: number | null
          skill_grade: string | null
          skills: string[] | null
          status: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          agency_id?: string | null
          assigned_creators?: number
          auth_user_id?: string | null
          avatar_seed?: string | null
          bio?: string | null
          certifications?: string[] | null
          commission_rate?: number | null
          created_at?: string
          daily_target_messages?: number | null
          daily_target_ppv?: number | null
          department?: string | null
          education?: string | null
          email: string
          emergency_contact?: string | null
          experience?: string | null
          hire_date?: string | null
          id?: string
          is_chatter?: boolean | null
          name: string
          phone?: string | null
          role: string
          salary?: number | null
          skill_grade?: string | null
          skills?: string[] | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          agency_id?: string | null
          assigned_creators?: number
          auth_user_id?: string | null
          avatar_seed?: string | null
          bio?: string | null
          certifications?: string[] | null
          commission_rate?: number | null
          created_at?: string
          daily_target_messages?: number | null
          daily_target_ppv?: number | null
          department?: string | null
          education?: string | null
          email?: string
          emergency_contact?: string | null
          experience?: string | null
          hire_date?: string | null
          id?: string
          is_chatter?: boolean | null
          name?: string
          phone?: string | null
          role?: string
          salary?: number | null
          skill_grade?: string | null
          skills?: string[] | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_data: {
        Row: {
          confidence: number | null
          created_at: string
          data_type: string
          id: string
          import_id: string
          period_end: string | null
          period_start: string | null
          platform: string | null
          raw_text: string | null
          value: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          data_type: string
          id?: string
          import_id: string
          period_end?: string | null
          period_start?: string | null
          platform?: string | null
          raw_text?: string | null
          value: number
        }
        Update: {
          confidence?: number | null
          created_at?: string
          data_type?: string
          id?: string
          import_id?: string
          period_end?: string | null
          period_start?: string | null
          platform?: string | null
          raw_text?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "extracted_data_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "data_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      felix_briefings: {
        Row: {
          agency_id: string
          alerts: Json | null
          briefing_date: string
          created_at: string
          id: string
          key_metrics: Json
          recommendations: Json | null
          summary: string
        }
        Insert: {
          agency_id: string
          alerts?: Json | null
          briefing_date: string
          created_at?: string
          id?: string
          key_metrics: Json
          recommendations?: Json | null
          summary: string
        }
        Update: {
          agency_id?: string
          alerts?: Json | null
          briefing_date?: string
          created_at?: string
          id?: string
          key_metrics?: Json
          recommendations?: Json | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "felix_briefings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "felix_briefings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      felix_queries: {
        Row: {
          action_taken: boolean | null
          agency_id: string
          created_at: string
          data_accessed: Json | null
          id: string
          query: string
          query_type: string | null
          response: string
          user_id: string
        }
        Insert: {
          action_taken?: boolean | null
          agency_id: string
          created_at?: string
          data_accessed?: Json | null
          id?: string
          query: string
          query_type?: string | null
          response: string
          user_id: string
        }
        Update: {
          action_taken?: boolean | null
          agency_id?: string
          created_at?: string
          data_accessed?: Json | null
          id?: string
          query?: string
          query_type?: string | null
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "felix_queries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "felix_queries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          agency_id: string | null
          created_at: string
          creator_id: string | null
          current_value: number
          end_date: string | null
          goal_type: string
          id: string
          start_date: string
          target_value: number
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          creator_id?: string | null
          current_value?: number
          end_date?: string | null
          goal_type?: string
          id?: string
          start_date?: string
          target_value?: number
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          creator_id?: string | null
          current_value?: number
          end_date?: string | null
          goal_type?: string
          id?: string
          start_date?: string
          target_value?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
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
          agency_id: string | null
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
          agency_id?: string | null
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
          agency_id?: string | null
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
            foreignKeyName: "invoices_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      izzy_conversations: {
        Row: {
          agency_id: string
          created_at: string
          creator_id: string | null
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          creator_id?: string | null
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          creator_id?: string | null
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "izzy_conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "izzy_conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "izzy_conversations_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      izzy_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          data_accessed: Json | null
          id: string
          query_type: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          data_accessed?: Json | null
          id?: string
          query_type?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          data_accessed?: Json | null
          id?: string
          query_type?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "izzy_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "izzy_conversations"
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
          agency_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_name: string
          sender_type: string
        }
        Insert: {
          agency_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_name: string
          sender_type: string
        }
        Update: {
          agency_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_name?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      of_cache: {
        Row: {
          cache_key: string
          cached_at: string | null
          created_at: string | null
          data: Json
          expires_at: string
          id: string
          of_account_id: string
        }
        Insert: {
          cache_key: string
          cached_at?: string | null
          created_at?: string | null
          data: Json
          expires_at: string
          id?: string
          of_account_id: string
        }
        Update: {
          cache_key?: string
          cached_at?: string | null
          created_at?: string | null
          data?: Json
          expires_at?: string
          id?: string
          of_account_id?: string
        }
        Relationships: []
      }
      of_chats: {
        Row: {
          agency_id: string | null
          created_at: string | null
          fan_avatar: string | null
          fan_name: string | null
          fan_username: string | null
          id: string
          is_pinned: boolean | null
          last_message_at: string | null
          last_message_is_from_me: boolean | null
          last_message_text: string | null
          of_account_id: string
          of_chat_id: string
          of_fan_id: string | null
          synced_at: string | null
          unread_count: number | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          fan_avatar?: string | null
          fan_name?: string | null
          fan_username?: string | null
          id?: string
          is_pinned?: boolean | null
          last_message_at?: string | null
          last_message_is_from_me?: boolean | null
          last_message_text?: string | null
          of_account_id: string
          of_chat_id: string
          of_fan_id?: string | null
          synced_at?: string | null
          unread_count?: number | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          fan_avatar?: string | null
          fan_name?: string | null
          fan_username?: string | null
          id?: string
          is_pinned?: boolean | null
          last_message_at?: string | null
          last_message_is_from_me?: boolean | null
          last_message_text?: string | null
          of_account_id?: string
          of_chat_id?: string
          of_fan_id?: string | null
          synced_at?: string | null
          unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "of_chats_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "of_chats_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      of_fans: {
        Row: {
          agency_id: string | null
          avatar_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string | null
          of_account_id: string
          of_fan_id: string
          renew_on: boolean | null
          subscribed_at: string | null
          synced_at: string | null
          total_spent: number | null
          username: string | null
        }
        Insert: {
          agency_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string | null
          of_account_id: string
          of_fan_id: string
          renew_on?: boolean | null
          subscribed_at?: string | null
          synced_at?: string | null
          total_spent?: number | null
          username?: string | null
        }
        Update: {
          agency_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string | null
          of_account_id?: string
          of_fan_id?: string
          renew_on?: boolean | null
          subscribed_at?: string | null
          synced_at?: string | null
          total_spent?: number | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "of_fans_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "of_fans_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      of_sync_logs: {
        Row: {
          agency_id: string | null
          created_at: string | null
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          id: string
          items_synced: number | null
          social_account_id: string | null
          status: string
          sync_type: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          items_synced?: number | null
          social_account_id?: string | null
          status: string
          sync_type: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          items_synced?: number | null
          social_account_id?: string | null
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "of_sync_logs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "of_sync_logs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "of_sync_logs_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "creator_social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      onlyfans_events: {
        Row: {
          agency_id: string
          created_at: string
          creator_id: string | null
          event_type: string
          id: string
          of_account_id: string
          payload: Json | null
          processed: boolean | null
        }
        Insert: {
          agency_id: string
          created_at?: string
          creator_id?: string | null
          event_type: string
          id?: string
          of_account_id: string
          payload?: Json | null
          processed?: boolean | null
        }
        Update: {
          agency_id?: string
          created_at?: string
          creator_id?: string | null
          event_type?: string
          id?: string
          of_account_id?: string
          payload?: Json | null
          processed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "onlyfans_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onlyfans_events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onlyfans_events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_applications: {
        Row: {
          agency_id: string
          application_type: string
          bio: string | null
          created_at: string
          department_preference: string | null
          email: string
          experience: string | null
          followers: string | null
          id: string
          instagram_url: string | null
          name: string
          notes: string | null
          onlyfans_url: string | null
          phone: string | null
          platform: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_preference: string | null
          skills: string[] | null
          snapchat_url: string | null
          status: string
          submitted_at: string
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          application_type: string
          bio?: string | null
          created_at?: string
          department_preference?: string | null
          email: string
          experience?: string | null
          followers?: string | null
          id?: string
          instagram_url?: string | null
          name: string
          notes?: string | null
          onlyfans_url?: string | null
          phone?: string | null
          platform?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_preference?: string | null
          skills?: string[] | null
          snapchat_url?: string | null
          status?: string
          submitted_at?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          application_type?: string
          bio?: string | null
          created_at?: string
          department_preference?: string | null
          email?: string
          experience?: string | null
          followers?: string | null
          id?: string
          instagram_url?: string | null
          name?: string
          notes?: string | null
          onlyfans_url?: string | null
          phone?: string | null
          platform?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_preference?: string | null
          skills?: string[] | null
          snapchat_url?: string | null
          status?: string
          submitted_at?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_applications_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_applications_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_type: string
        }
        Insert: {
          agency_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
          user_type: string
        }
        Update: {
          agency_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      qc_shift_assignments: {
        Row: {
          agency_id: string | null
          created_at: string
          effective_date: string
          id: string
          qc_employee_id: string
          shift_block: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          effective_date?: string
          id?: string
          qc_employee_id: string
          shift_block: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          effective_date?: string
          id?: string
          qc_employee_id?: string
          shift_block?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_shift_assignments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_shift_assignments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_shift_assignments_qc_employee_id_fkey"
            columns: ["qc_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_creators: {
        Row: {
          agency_id: string | null
          alias: string | null
          country: string | null
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
          agency_id?: string | null
          alias?: string | null
          country?: string | null
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
          agency_id?: string | null
          alias?: string | null
          country?: string | null
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
        Relationships: [
          {
            foreignKeyName: "recruiting_creators_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_creators_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      session_access_logs: {
        Row: {
          action: string
          chatter_id: string
          created_at: string
          id: string
          ip_address: string | null
          session_link_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          chatter_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          session_link_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          chatter_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          session_link_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_access_logs_chatter_id_fkey"
            columns: ["chatter_id"]
            isOneToOne: false
            referencedRelation: "chatters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_access_logs_session_link_id_fkey"
            columns: ["session_link_id"]
            isOneToOne: false
            referencedRelation: "creator_session_links"
            referencedColumns: ["id"]
          },
        ]
      }
      session_link_assignments: {
        Row: {
          access_count: number
          accessed_at: string | null
          assigned_at: string
          chatter_id: string
          id: string
          last_access_ip: string | null
          session_link_id: string
          shift_id: string | null
        }
        Insert: {
          access_count?: number
          accessed_at?: string | null
          assigned_at?: string
          chatter_id: string
          id?: string
          last_access_ip?: string | null
          session_link_id: string
          shift_id?: string | null
        }
        Update: {
          access_count?: number
          accessed_at?: string | null
          assigned_at?: string
          chatter_id?: string
          id?: string
          last_access_ip?: string | null
          session_link_id?: string
          shift_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_link_assignments_chatter_id_fkey"
            columns: ["chatter_id"]
            isOneToOne: false
            referencedRelation: "chatters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_link_assignments_session_link_id_fkey"
            columns: ["session_link_id"]
            isOneToOne: false
            referencedRelation: "creator_session_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_link_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "chatter_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_documents: {
        Row: {
          agency_id: string | null
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
          agency_id?: string | null
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
          agency_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "sop_documents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_documents_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          agency_id: string | null
          assignee_id: string | null
          chatter_id: string | null
          created_at: string
          creator_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          request_type: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          assignee_id?: string | null
          chatter_id?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          request_type?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          assignee_id?: string | null
          chatter_id?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          request_type?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
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
      tatum_conversations: {
        Row: {
          agency_id: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tatum_conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tatum_conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tatum_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          data_accessed: Json | null
          id: string
          query_type: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          data_accessed?: Json | null
          id?: string
          query_type?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          data_accessed?: Json | null
          id?: string
          query_type?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "tatum_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "tatum_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_links: {
        Row: {
          agency_id: string
          campaign: string | null
          clicks: number | null
          code: string
          conversions: number | null
          created_at: string
          creator_id: string
          id: string
          is_active: boolean | null
          name: string
          of_account_id: string | null
          revenue: number | null
          source: string | null
          updated_at: string
          url: string
        }
        Insert: {
          agency_id: string
          campaign?: string | null
          clicks?: number | null
          code: string
          conversions?: number | null
          created_at?: string
          creator_id: string
          id?: string
          is_active?: boolean | null
          name: string
          of_account_id?: string | null
          revenue?: number | null
          source?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          agency_id?: string
          campaign?: string | null
          clicks?: number | null
          code?: string
          conversions?: number | null
          created_at?: string
          creator_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          of_account_id?: string | null
          revenue?: number | null
          source?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_links_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_links_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_links_creator_id_fkey"
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
      agencies_public: {
        Row: {
          id: string | null
          logo_url: string | null
          name: string | null
        }
        Insert: {
          id?: string | null
          logo_url?: string | null
          name?: string | null
        }
        Update: {
          id?: string | null
          logo_url?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_agency_creator_limit: { Args: never; Returns: boolean }
      check_agency_employee_limit: { Args: never; Returns: boolean }
      cleanup_expired_of_cache: { Args: never; Returns: undefined }
      get_agency_creator_count: {
        Args: { p_agency_id: string }
        Returns: number
      }
      get_agency_employee_count: {
        Args: { p_agency_id: string }
        Returns: number
      }
      get_user_agency_id: { Args: never; Returns: string }
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
