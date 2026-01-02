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
      agencies: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          max_creators: number
          max_employees: number
          name: string
          subscription_tier: string
          updated_at: string
          website: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          max_creators?: number
          max_employees?: number
          name: string
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          max_creators?: number
          max_employees?: number
          name?: string
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
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
      chatter_time_logs: {
        Row: {
          chatter_id: string
          clock_in: string
          clock_out: string | null
          created_at: string
          duration_minutes: number | null
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
          created_at: string
          creator_id: string
          description: string | null
          id: string
          platform: string | null
          reference_media: Json | null
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          platform?: string | null
          reference_media?: Json | null
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          platform?: string | null
          reference_media?: Json | null
          scheduled_date?: string | null
          status?: string
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
      creator_social_accounts: {
        Row: {
          account_type: string
          created_at: string
          creator_id: string
          id: string
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
      creators: {
        Row: {
          agency_id: string | null
          alias: string | null
          avatar_seed: string | null
          avatar_url: string | null
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
          agency_id?: string | null
          alias?: string | null
          avatar_seed?: string | null
          avatar_url?: string | null
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
          agency_id?: string | null
          alias?: string | null
          avatar_seed?: string | null
          avatar_url?: string | null
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
            foreignKeyName: "creators_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
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
          department: string | null
          education: string | null
          email: string
          emergency_contact: string | null
          experience: string | null
          hire_date: string | null
          id: string
          name: string
          phone: string | null
          role: string
          salary: number | null
          skills: string[] | null
          status: string
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
          department?: string | null
          education?: string | null
          email: string
          emergency_contact?: string | null
          experience?: string | null
          hire_date?: string | null
          id?: string
          name: string
          phone?: string | null
          role: string
          salary?: number | null
          skills?: string[] | null
          status?: string
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
          department?: string | null
          education?: string | null
          email?: string
          emergency_contact?: string | null
          experience?: string | null
          hire_date?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
          salary?: number | null
          skills?: string[] | null
          status?: string
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
      check_agency_creator_limit: { Args: never; Returns: boolean }
      check_agency_employee_limit: { Args: never; Returns: boolean }
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
